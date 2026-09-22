const { User } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const updateProfile = catchAsync(async (req, res) => {
  const { full_name, avatar_url } = req.body;
  const user = await User.findByPk(req.user.id);
  if (!user) throw new AppError('Người dùng không tồn tại.', 404);

  if (full_name) user.full_name = full_name;
  if (avatar_url) user.avatar_url = avatar_url;

  await user.save();
  return ApiResponse.success(res, user, 'Cập nhật thông tin cá nhân thành công');
});

const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findByPk(req.user.id);
  if (!user) throw new AppError('Người dùng không tồn tại.', 404);

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Mật khẩu hiện tại không đúng.', 400);

  user.password_hash = newPassword;
  await user.save();

  return ApiResponse.success(res, null, 'Đổi mật khẩu thành công');
});

const setLearningGoal = catchAsync(async (req, res) => {
  const { learning_goal } = req.body;
  const user = await User.findByPk(req.user.id);
  if (!user) throw new AppError('Người dùng không tồn tại.', 404);

  user.learning_goal = learning_goal;
  await user.save();

  return ApiResponse.success(res, user, 'Thiết lập mục tiêu học tập thành công');
});

const uploadAvatar = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError('Vui lòng chọn một file ảnh để tải lên.', 400);
  }
  const avatarUrl = `/uploads/${req.file.filename}`;
  const user = await User.findByPk(req.user.id);
  user.avatar_url = avatarUrl;
  await user.save();

  return ApiResponse.success(res, { avatar_url: avatarUrl }, 'Tải ảnh đại diện thành công');
});

module.exports = {
  updateProfile,
  changePassword,
  setLearningGoal,
  uploadAvatar
};
