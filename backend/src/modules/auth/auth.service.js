const crypto = require("crypto");
const { prisma } = require("../../config/prisma");
const { hashPassword, comparePassword } = require("../../utils/password");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../../utils/jwt");
const { ApiError } = require("../../utils/apiError");
const { sendEmail } = require("../../config/email");

const PUBLIC_USER_FIELDS = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  isEmailVerified: true,
  createdAt: true,
};

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function issueTokens(user) {
  const payload = { sub: user.id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  return { accessToken, refreshToken };
}

async function register({ email, password, firstName, lastName }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const passwordHash = await hashPassword(password);
  const emailVerifyToken = generateToken();
  const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      emailVerifyToken,
      emailVerifyExpiry,
    },
    select: PUBLIC_USER_FIELDS,
  });


  await sendEmail({
    to: email,
    subject: "Verify your DevFlow account",
    html: `<p>Hi ${firstName},</p>
      <p>Welcome to DevFlow. Verify your email using this code:</p>
      <p style="font-size:20px;font-weight:bold;">${emailVerifyToken}</p>
      <p>This code expires in 24 hours.</p>`,
  });

  const tokens = issueTokens(user);
  await persistRefreshToken(user.id, tokens.refreshToken);

  return { user, ...tokens };
}

async function login({ email, password }) {
  // Need passwordHash to verify the password, but must never let it
  // (or the other sensitive token fields) reach the response — so
  // fetch it separately here rather than trying to select it out later.
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const tokens = issueTokens(user);
  await persistRefreshToken(user.id, tokens.refreshToken);

  // Re-fetch with an explicit safe select, same pattern as register() —
  // this makes it structurally impossible to accidentally leak a new
  // sensitive field added to the User model in the future, since only
  // fields explicitly listed here ever get returned.
  const publicUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: PUBLIC_USER_FIELDS,
  });

  return { user: publicUser, ...tokens };
}

async function refreshSession(refreshToken) {
  if (!refreshToken) {
    throw ApiError.unauthorized("Refresh token missing");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
  if (!user) {
    throw ApiError.unauthorized("User no longer exists");
  }

  const incomingHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  if (incomingHash !== user.refreshTokenHash) {
    throw ApiError.unauthorized("Refresh token has been revoked");
  }

  const tokens = issueTokens(user);
  await persistRefreshToken(user.id, tokens.refreshToken);

  return tokens;
}

async function logout(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash: null },
  });
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const isValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isValid) {
    throw ApiError.unauthorized("Current password is incorrect");
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, refreshTokenHash: null },
  });
}

async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return;

      await sendEmail({
     to: email,
    subject: "Reset your DevFlow password",
    html: `<p>Hi ${user.firstName},</p>
      <p>Use this code to reset your password:</p>
      <p style="font-size:20px;font-weight:bold;">${resetToken}</p>
      <p>This code expires in 1 hour. If you didn't request this, you can ignore this email.</p>`,
  });

  }

  const resetToken = generateToken();
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1h

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiry },
  });
}

async function resetPassword(token, newPassword) {
  const user = await prisma.user.findFirst({
    where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
  });

  if (!user) {
    throw ApiError.badRequest("Invalid or expired reset token");
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
      refreshTokenHash: null,
    },
  });
}

async function verifyEmail(token) {
  const user = await prisma.user.findFirst({
    where: { emailVerifyToken: token, emailVerifyExpiry: { gt: new Date() } },
  });

  if (!user) {
    throw ApiError.badRequest("Invalid or expired verification token");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerifyToken: null,
      emailVerifyExpiry: null,
    },
  });
}

module.exports = {
  register,
  login,
  refreshSession,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  PUBLIC_USER_FIELDS,
};