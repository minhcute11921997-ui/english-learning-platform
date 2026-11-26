const {
  User,
  Vocabulary,
  Topic,
  VocabExample,
  AdminAuditLog,
  sequelize
} = require('../models');
const { Op } = require('sequelize');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const visionService = require('../services/vision.service');

async function recordAuditLog({ admin_id, action, target_type, target_id, details, ip_address }) {
  if (!AdminAuditLog || typeof AdminAuditLog.create !== 'function') return;
  try {
    await AdminAuditLog.create({
      admin_id: admin_id || null,
      action,
      target_type,
      target_id: target_id != null ? String(target_id) : null,
      details: details || null,
      ip_address: ip_address || null
    });
  } catch {
    // Không làm gián đoạn thao tác chính nếu ghi log gặp lỗi
  }
}

// === QUẢN TRỊ NGƯỜI DÙNG ===

const getUsers = catchAsync(async (req, res) => {
  const { search, role } = req.query;
  const page = Number(req.query.page || 1), limit = Number(req.query.limit || 20);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new AppError('Invalid pagination.', 400);
  }
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
    attributes: { exclude: ['password_hash', 'password_reset_token', 'email_verification_token'] },
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']]
  });

  return ApiResponse.paginated(res, users, { page: parseInt(page), limit: parseInt(limit), total }, 'Lấy danh sách người dùng thành công');
});

// Lock all active admins in a stable order before any role/status change.
async function changeUser(id, change, actorId) {
  return sequelize.transaction(async t => {
    const admins = await User.findAll({ where: { role: 'admin', is_active: true }, order: [['id', 'ASC']], transaction: t, lock: t.LOCK.UPDATE });
    const user = await User.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!user) throw new AppError('User not found.', 404);
    const next = change(user);
    if (user.role === 'admin' && user.is_active && (next.role === 'learner' || next.is_active === false) && admins.length <= 1) {
      throw new AppError('The last active admin cannot be disabled or demoted.', 409);
    }
    if (Number(id) === Number(actorId) && (next.role === 'learner' || next.is_active === false)) {
      throw new AppError('You cannot disable or demote your own account.', 400);
    }
    Object.assign(user, next);
    await user.save({ transaction: t });
    return user;
  });
}

const updateUserRole = catchAsync(async (req, res) => {
  const { role } = req.body;
  if (!['learner', 'admin'].includes(role)) throw new AppError('Invalid role.', 400);
  const user = await changeUser(req.params.id, () => ({ role }), req.user.id);
  await recordAuditLog({
    admin_id: req.user.id,
    action: 'UPDATE_USER_ROLE',
    target_type: 'User',
    target_id: user.id,
    details: { role },
    ip_address: req.ip
  });
  return ApiResponse.success(res, user, 'Cập nhật quyền người dùng thành công');
});

const toggleUserStatus = catchAsync(async (req, res) => {
  const user = await changeUser(req.params.id, user => ({ is_active: !user.is_active }), req.user.id);
  await recordAuditLog({
    admin_id: req.user.id,
    action: 'TOGGLE_USER_STATUS',
    target_type: 'User',
    target_id: user.id,
    details: { is_active: user.is_active },
    ip_address: req.ip
  });
  return ApiResponse.success(res, user, 'Cập nhật trạng thái thành công');
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

  await recordAuditLog({
    admin_id: req.user.id,
    action: 'CREATE_VOCABULARY',
    target_type: 'Vocabulary',
    target_id: vocab.id,
    details: { word: vocab.word, topic_id: vocab.topic_id },
    ip_address: req.ip
  });

  return ApiResponse.created(res, vocab, 'Tạo từ vựng mới thành công');
});

const updateVocabulary = catchAsync(async (req, res) => {
  const { id } = req.params;
  const vocab = await Vocabulary.findByPk(id);
  if (!vocab) throw new AppError('Không tìm thấy từ vựng.', 404);

  await vocab.update(req.body);
  visionService.invalidateVocabCache();
  visionService.syncVocabLabel(vocab).catch(() => {});

  await recordAuditLog({
    admin_id: req.user.id,
    action: 'UPDATE_VOCABULARY',
    target_type: 'Vocabulary',
    target_id: vocab.id,
    details: { word: vocab.word },
    ip_address: req.ip
  });

  return ApiResponse.success(res, vocab, 'Cập nhật từ vựng thành công');
});

const deleteVocabulary = catchAsync(async (req, res) => {
  const { id } = req.params;
  const vocab = await Vocabulary.findByPk(id);
  if (!vocab) throw new AppError('Không tìm thấy từ vựng.', 404);

  const deletedWord = vocab.word;
  await vocab.destroy();
  visionService.invalidateVocabCache();

  await recordAuditLog({
    admin_id: req.user.id,
    action: 'DELETE_VOCABULARY',
    target_type: 'Vocabulary',
    target_id: id,
    details: { word: deletedWord },
    ip_address: req.ip
  });

  return ApiResponse.success(res, null, 'Xóa từ vựng thành công');
});

const getAuditLogs = catchAsync(async (req, res) => {
  const page = Number(req.query.page || 1), limit = Number(req.query.limit || 20);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new AppError('Invalid pagination.', 400);
  }
  const offset = (page - 1) * limit;
  const where = {};
  if (req.query.action) where.action = req.query.action;

  if (!AdminAuditLog || typeof AdminAuditLog.findAndCountAll !== 'function') {
    return ApiResponse.paginated(res, [], { page, limit, total: 0 }, 'Lấy nhật ký quản trị thành công');
  }

  const { rows: logs, count: total } = await AdminAuditLog.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });

  return ApiResponse.paginated(res, logs, { page, limit, total }, 'Lấy nhật ký quản trị thành công');
});

module.exports = {
  getUsers,
  updateUserRole,
  toggleUserStatus,
  createVocabulary,
  updateVocabulary,
  deleteVocabulary,
  getAuditLogs
};
