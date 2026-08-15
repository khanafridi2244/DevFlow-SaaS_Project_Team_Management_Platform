const authService = require("./auth.service");
const { ApiResponse } = require("../../utils/apiResponse");
const { asyncHandler } = require("../../utils/asyncHandler");
const { env } = require("../../config/env");

const cookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? "strict" : "lax",
  maxAge: maxAgeMs,
});

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15m
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30d

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie(env.cookies.accessTokenName, accessToken, cookieOptions(ACCESS_TOKEN_MAX_AGE));
  res.cookie(env.cookies.refreshTokenName, refreshToken, cookieOptions(REFRESH_TOKEN_MAX_AGE));
}

function clearAuthCookies(res) {
  res.clearCookie(env.cookies.accessTokenName);
  res.clearCookie(env.cookies.refreshTokenName);
}

const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);
  setAuthCookies(res, accessToken, refreshToken);
  new ApiResponse(201, { user }, "Account created successfully").send(res);
});

const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  setAuthCookies(res, accessToken, refreshToken);
  new ApiResponse(200, { user }, "Logged in successfully").send(res);
});

const refresh = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.[env.cookies.refreshTokenName];
  const { accessToken, refreshToken } = await authService.refreshSession(incomingRefreshToken);
  setAuthCookies(res, accessToken, refreshToken);
  new ApiResponse(200, null, "Session refreshed").send(res);
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id);
  clearAuthCookies(res);
  new ApiResponse(200, null, "Logged out successfully").send(res);
});

const me = asyncHandler(async (req, res) => {
  new ApiResponse(200, { user: req.user }, "Current user fetched").send(res);
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  clearAuthCookies(res); // force re-login after password change
  new ApiResponse(200, null, "Password changed successfully. Please log in again.").send(res);
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  // Always the same message, regardless of whether the email exists
  new ApiResponse(200, null, "If that email exists, a reset link has been sent").send(res);
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  await authService.resetPassword(token, newPassword);
  new ApiResponse(200, null, "Password reset successfully. Please log in.").send(res);
});

const verifyEmail = asyncHandler(async (req, res) => {
  await authService.verifyEmail(req.body.token);
  new ApiResponse(200, null, "Email verified successfully").send(res);
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
};