const AuthService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { User } = require('../models');

const register = catchAsync(async (req, res) => {
  const { username, email, password, full_name, role } = req.body;
  const result = await AuthService.register({ username, email, password, full_name, role });
  return ApiResponse.created(res, result, 'Đăng ký tài khoản thành công');
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await AuthService.login({ email, password });
  return ApiResponse.success(res, result, 'Đăng nhập thành công');
});

const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken: token } = req.body;
  const result = await AuthService.refreshToken(token);
  return ApiResponse.success(res, result, 'Làm mới token thành công');
});

const logout = catchAsync(async (req, res) => {
  return ApiResponse.success(res, null, 'Đăng xuất thành công');
});

const getMe = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) {
    throw new AppError('Người dùng không tồn tại.', 404);
  }
  return ApiResponse.success(res, user, 'Lấy thông tin người dùng thành công');
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe
};
