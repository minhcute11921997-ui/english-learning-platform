const fs = require('fs');
const path = require('path');
const {
  User,
  UserVocabProgress,
  UserVocabList,
  ReviewEvent,
  RefreshToken,
  sequelize
} = require('../models');
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

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) throw new AppError('Không tìm thấy người dùng.', 404);

    const oldAvatar = user.avatar_url;
    user.avatar_url = avatarUrl;
    await user.save();

    // Xóa ảnh cũ nếu là ảnh tự upload trước đó
    if (oldAvatar && oldAvatar.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '../../uploads', path.basename(oldAvatar));
      fs.unlink(oldPath, () => {});
    }

    return ApiResponse.success(res, { avatar_url: avatarUrl }, 'Tải ảnh đại diện thành công');
  } catch (err) {
    // Nếu xảy ra lỗi giữa chừng, xóa file vừa upload để tránh file rác
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    throw err;
  }
});

const exportMyData = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) throw new AppError('Người dùng không tồn tại.', 404);

  const [vocabProgress, vocabLists, reviewEvents] = await Promise.all([
    UserVocabProgress ? UserVocabProgress.findAll({ where: { user_id: req.user.id } }) : [],
    UserVocabList ? UserVocabList.findAll({ where: { user_id: req.user.id } }) : [],
    ReviewEvent ? ReviewEvent.findAll({ where: { user_id: req.user.id } }) : []
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    user: typeof user.toJSON === 'function' ? user.toJSON() : user,
    vocab_lists: vocabLists,
    vocab_progress: vocabProgress,
    review_events: reviewEvents
  };

  return ApiResponse.success(res, payload, 'Xuất dữ liệu cá nhân thành công');
});

const deleteMyAccount = catchAsync(async (req, res) => {
  const { password } = req.body || {};
  if (!password) {
    throw new AppError('Vui lòng nhập mật khẩu để xác nhận xóa tài khoản.', 400);
  }

  const user = await User.findByPk(req.user.id);
  if (!user) throw new AppError('Người dùng không tồn tại.', 404);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Mật khẩu xác nhận không đúng.', 401);
  }

  const oldAvatar = user.avatar_url;

  await sequelize.transaction(async (t) => {
    const admins = await User.findAll({
      where: { role: 'admin', is_active: true },
      order: [['id', 'ASC']],
      transaction: t,
      lock: t.LOCK.UPDATE
    });
    const target = await User.findByPk(req.user.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!target) throw new AppError('Người dùng không tồn tại.', 404);

    if (target.role === 'admin' && target.is_active && admins.length <= 1) {
      throw new AppError('Không thể xóa tài khoản quản trị viên hoạt động cuối cùng.', 409);
    }

    if (RefreshToken && typeof RefreshToken.destroy === 'function') {
      await RefreshToken.destroy({ where: { user_id: target.id }, transaction: t });
    }

    await target.destroy({ transaction: t });
  });

  if (oldAvatar && oldAvatar.startsWith('/uploads/')) {
    const oldPath = path.join(__dirname, '../../uploads', path.basename(oldAvatar));
    fs.unlink(oldPath, () => {});
  }

  if (typeof res.clearCookie === 'function') {
    res.clearCookie('refreshToken', { path: '/api/auth' });
  }

  return ApiResponse.success(res, null, 'Tài khoản của bạn đã được xóa vĩnh viễn');
});

module.exports = {
  updateProfile,
  changePassword,
  setLearningGoal,
  uploadAvatar,
  exportMyData,
  deleteMyAccount
};
