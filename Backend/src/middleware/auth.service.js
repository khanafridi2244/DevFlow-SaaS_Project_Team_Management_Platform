const crypto = require("crypto");
const { prisma } = require("../../config/prisma");
const { hashPassword, comparePassword } = require("../../utils/password");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../../utils/jwt");
const { ApiError } = require("../../utils/apiError");

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

  // TODO (Phase 5 - email integration): send verification email with emailVerifyToken
  const tokens = issueTokens(user);
  await persistRefreshToken(user.id, tokens.refreshToken);

  return { user, ...tokens };
}

async function login({ email, password }) {
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

  const { passwordHash, refreshTokenHash, ...publicUser } = user;
  return { user: publicUser, ...tokens };
}

async function persistRefreshToken(userId, refreshToken) {
  // Store a hash of the refresh token, not the token itself —
  // so a leaked DB doesn't hand out valid refresh tokens directly.
  const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash },
  });
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
    // Token doesn't match what we last issued — possible reuse of a
    // revoked/rotated token. Treat as compromised.
    throw ApiError.unauthorized("Refresh token has been revoked");
  }

  const tokens = issueTokens(user);
  await persistRefreshToken(user.id, tokens.refreshToken); // rotate

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
    data: { passwordHash, refreshTokenHash: null }, // force re-login on other devices
  });
}

async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Deliberately don't reveal whether the email exists — prevents
    // attackers from using this endpoint to enumerate valid accounts.
    return;
  }

  const resetToken = generateToken();
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1h

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiry },
  });

  // TODO (Phase 5 - email integration): send reset email with resetToken
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