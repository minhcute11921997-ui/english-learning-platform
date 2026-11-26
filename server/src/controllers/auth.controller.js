const AuthService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const config = require('../config/app');
const { User } = require('../models');

function setRefreshCookie(res, token) {
  if (!token || typeof res.cookie !== 'function') return;
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: config.cookie?.secure ?? config.env === 'production',
    sameSite: config.cookie?.sameSite || 'lax',
    path: '/api/auth',
    maxAge: config.cookie?.maxAgeMs || 30 * 24 * 60 * 60 * 1000
  });
}

function clearRefreshCookie(res) {
  if (typeof res.clearCookie !== 'function') return;
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: config.cookie?.secure ?? config.env === 'production',
    sameSite: config.cookie?.sameSite || 'lax',
    path: '/api/auth'
  });
}

const register = catchAsync(async (req, res) => {
  const { username, email, password, full_name } = req.body;
  const result = await AuthService.register({ username, email, password, full_name });
  setRefreshCookie(res, result.refreshToken);
  return ApiResponse.created(res, result, 'Đăng ký tài khoản thành công');
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await AuthService.login({ email, password });
  setRefreshCookie(res, result.refreshToken);
  return ApiResponse.success(res, result, 'Đăng nhập thành công');
});

const refreshToken = catchAsync(async (req, res) => {
  const token = req.body?.refreshToken || req.cookies?.refreshToken;
  const result = await AuthService.refreshToken(token);
  setRefreshCookie(res, result.refreshToken);
  return ApiResponse.success(res, result, 'Làm mới token thành công');
});

const logout = catchAsync(async (req, res) => {
  const token = req.body?.refreshToken || req.cookies?.refreshToken;
  await AuthService.logout(token);
  clearRefreshCookie(res);
  return ApiResponse.success(res, null, 'Đăng xuất thành công');
});

const getMe = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) {
    throw new AppError('Người dùng không tồn tại.', 404);
  }
  return ApiResponse.success(res, user, 'Lấy thông tin người dùng thành công');
});

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await AuthService.forgotPassword(email);
  return ApiResponse.success(res, result, result.message);
});

const resetPassword = catchAsync(async (req, res) => {
  const { token, newPassword } = req.body;
  const result = await AuthService.resetPassword({ token, newPassword });
  clearRefreshCookie(res);
  return ApiResponse.success(res, null, result.message);
});

const verifyEmail = catchAsync(async (req, res) => {
  const token = req.body?.token || req.query?.token;
  const result = await AuthService.verifyEmail(token);
  return ApiResponse.success(res, null, result.message);
});

const resendVerification = catchAsync(async (req, res) => {
  const result = await AuthService.requestEmailVerification(req.user.id);
  return ApiResponse.success(res, result, result.message);
});

const googleLogin = catchAsync(async (req, res) => {
  const { credential } = req.body;
  const result = await AuthService.loginWithGoogle({ credential });
  setRefreshCookie(res, result.refreshToken);
  return ApiResponse.success(res, result, 'Đăng nhập bằng Google thành công');
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  googleLogin
};
