const { verifyAccessToken } = require("../utils/jwt");
const { ApiError } = require("../utils/apiError");
const { env } = require("../config/env");
const { prisma } = require("../config/prisma");
const { asyncHandler } = require("../utils/asyncHandler");

const verifyJWT = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[env.cookies.accessTokenName];

  if (!token) {
    throw ApiError.unauthorized("Access token missing");
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw ApiError.unauthorized("Access token expired");
    }
    throw ApiError.unauthorized("Invalid access token");
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.sub },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      isEmailVerified: true,
    },
  });

  if (!user) {
    throw ApiError.unauthorized("User no longer exists");
  }

  req.user = user;
  next();
});

module.exports = { verifyJWT };