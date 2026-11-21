const {
  User,
  Vocabulary,
  Topic,
  VocabExample,
  sequelize
} = require('../models');
const { Op } = require('sequelize');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const visionService = require('../services/vision.service');

// === QUẢN TRỊ NGƯỜI DÙNG ===

const getUsers = catchAsync(async (req, res) => {
  const { search, role, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (role) where.role = role;
  if (search) {
    where[Op.or] = [
      { username: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { full_name: { [Op.like]: `%${search}%` } }
    ];
  }

  const { rows: users, count: total } = await User.findAndCountAll({
    where,
    attributes: { exclude: ['password_hash'] },
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']]
  });

  return ApiResponse.paginated(res, users, { page: parseInt(page), limit: parseInt(limit), total }, 'Lấy danh sách người dùng thành công');
});

const updateUserRole = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['learner', 'admin'].includes(role)) {
    throw new AppError('Vai trò (role) không hợp lệ.', 400);
  }

  if (Number(id) === Number(req.user.id) && role !== 'admin') {
    throw new AppError('Bạn không thể tự hạ quyền quản trị của chính mình.', 400);
  }

  const user = await User.findByPk(id);
  if (!user) throw new AppError('Không tìm thấy người dùng.', 404);

  user.role = role;
  await user.save();

  return ApiResponse.success(res, user, 'Cập nhật quyền người dùng thành công');
});

const toggleUserStatus = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (Number(id) === Number(req.user.id)) {
    throw new AppError('Bạn không thể tự khóa tài khoản của chính mình.', 400);
  }

  const user = await User.findByPk(id);
  if (!user) throw new AppError('Không tìm thấy người dùng.', 404);

  user.is_active = !user.is_active;
  await user.save();

  return ApiResponse.success(res, user, `Tài khoản đã ${user.is_active ? 'mở khóa' : 'bị khóa'}`);
});

// === QUẢN TRỊ TỪ VỰNG MỸ THUẬT & MỸ NGHỆ ===

const createVocabulary = catchAsync(async (req, res) => {
  const {
    topic_id,
    word,
    pronunciation,
    part_of_speech,
    meaning_vi,
    example_sentence,
    example_translation,
    image_url,
    image_alt,
    image_credit,
    cultural_note,
    related_artist,
    source_ref,
    difficulty
  } = req.body;

  const vocab = await Vocabulary.create({
    topic_id,
    word,
    pronunciation,
    part_of_speech,
    meaning_vi,
    example_sentence,
    example_translation,
    image_url,
    image_alt,
    image_credit,
    cultural_note,
    related_artist,
    source_ref,
    difficulty: difficulty || 'easy',
    source_type: 'system',
    is_approved: true
  });

  if (example_sentence) {
    await VocabExample.create({
      vocabulary_id: vocab.id,
      sentence: example_sentence,
      translation: example_translation
    });
  }

  visionService.invalidateVocabCache();
  visionService.syncVocabLabel(vocab).catch(() => {});

  return ApiResponse.created(res, vocab, 'Tạo từ vựng mới thành công');
});

const updateVocabulary = catchAsync(async (req, res) => {
  const { id } = req.params;
  const vocab = await Vocabulary.findByPk(id);
  if (!vocab) throw new AppError('Không tìm thấy từ vựng.', 404);

  await vocab.update(req.body);
  visionService.invalidateVocabCache();
  visionService.syncVocabLabel(vocab).catch(() => {});
  return ApiResponse.success(res, vocab, 'Cập nhật từ vựng thành công');
});

const deleteVocabulary = catchAsync(async (req, res) => {
  const { id } = req.params;
  const vocab = await Vocabulary.findByPk(id);
  if (!vocab) throw new AppError('Không tìm thấy từ vựng.', 404);

  await vocab.destroy();
  visionService.invalidateVocabCache();
  return ApiResponse.success(res, null, 'Xóa từ vựng thành công');
});

module.exports = {
  getUsers,
  updateUserRole,
  toggleUserStatus,
  createVocabulary,
  updateVocabulary,
  deleteVocabulary
};
