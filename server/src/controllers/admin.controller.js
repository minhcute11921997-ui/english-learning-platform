const {
  User,
  Vocabulary,
  Reading,
  Question,
  CommunityPost,
  Topic,
  VocabExample
} = require('../models');
const { Op } = require('sequelize');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

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
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']]
  });

  return ApiResponse.paginated(res, users, { page: parseInt(page), limit: parseInt(limit), total }, 'Lấy danh sách người dùng thành công');
});

const updateUserRole = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['learner', 'group_owner', 'admin'].includes(role)) {
    throw new AppError('Vai trò (role) không hợp lệ.', 400);
  }

  const user = await User.findByPk(id);
  if (!user) throw new AppError('Không tìm thấy người dùng.', 404);

  user.role = role;
  await user.save();

  return ApiResponse.success(res, user, 'Cập nhật quyền người dùng thành công');
});

const toggleUserStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByPk(id);
  if (!user) throw new AppError('Không tìm thấy người dùng.', 404);

  user.is_active = !user.is_active;
  await user.save();

  return ApiResponse.success(res, user, `Tài khoản đã ${user.is_active ? 'mở khóa' : 'bị khóa'}`);
});

// === QUẢN TRỊ TỪ VỰNG ===

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

  return ApiResponse.created(res, vocab, 'Tạo từ vựng mới thành công');
});

const updateVocabulary = catchAsync(async (req, res) => {
  const { id } = req.params;
  const vocab = await Vocabulary.findByPk(id);
  if (!vocab) throw new AppError('Không tìm thấy từ vựng.', 404);

  await vocab.update(req.body);
  return ApiResponse.success(res, vocab, 'Cập nhật từ vựng thành công');
});

const deleteVocabulary = catchAsync(async (req, res) => {
  const { id } = req.params;
  const vocab = await Vocabulary.findByPk(id);
  if (!vocab) throw new AppError('Không tìm thấy từ vựng.', 404);

  await vocab.destroy();
  return ApiResponse.success(res, null, 'Xóa từ vựng thành công');
});

// === QUẢN TRỊ BÀI ĐỌC & CÂU HỎI ===

const createReading = catchAsync(async (req, res) => {
  const { topic_id, title, title_vi, content, content_vi, difficulty, questions = [] } = req.body;

  const reading = await Reading.create({
    topic_id,
    title,
    title_vi,
    content,
    content_vi,
    difficulty: difficulty || 'easy',
    word_count: content ? content.split(/\s+/).length : 0,
    estimated_time_minutes: Math.ceil((content ? content.split(/\s+/).length : 0) / 40),
    source_type: 'system',
    is_approved: true
  });

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    await Question.create({
      reading_id: reading.id,
      question_text: q.question_text,
      question_text_vi: q.question_text_vi,
      options: q.options,
      correct_option: q.correct_option,
      explanation_vi: q.explanation_vi,
      display_order: i
    });
  }

  return ApiResponse.created(res, reading, 'Tạo bài đọc mới thành công');
});

const updateReading = catchAsync(async (req, res) => {
  const { id } = req.params;
  const reading = await Reading.findByPk(id);
  if (!reading) throw new AppError('Không tìm thấy bài đọc.', 404);

  await reading.update(req.body);
  return ApiResponse.success(res, reading, 'Cập nhật bài đọc thành công');
});

const deleteReading = catchAsync(async (req, res) => {
  const { id } = req.params;
  const reading = await Reading.findByPk(id);
  if (!reading) throw new AppError('Không tìm thấy bài đọc.', 404);

  await reading.destroy();
  return ApiResponse.success(res, null, 'Xóa bài đọc thành công');
});

// === KIỂM DUYỆT BÀI CỘNG ĐỒNG ===

const getPendingCommunityPosts = catchAsync(async (req, res) => {
  const posts = await CommunityPost.findAll({
    where: { status: 'pending' },
    include: [{ model: User, as: 'author', attributes: ['id', 'username', 'full_name', 'email'] }],
    order: [['created_at', 'ASC']]
  });

  return ApiResponse.success(res, posts, 'Lấy danh sách bài chờ duyệt thành công');
});

const reviewCommunityPost = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, admin_note } = req.body; // status: 'approved' | 'rejected'

  if (!['approved', 'rejected'].includes(status)) {
    throw new AppError('Trạng thái duyệt phải là "approved" hoặc "rejected".', 400);
  }

  const post = await CommunityPost.findByPk(id);
  if (!post) throw new AppError('Không tìm thấy bài đăng.', 404);

  post.status = status;
  post.admin_note = admin_note || null;
  post.reviewed_at = new Date();
  await post.save();

  return ApiResponse.success(res, post, `Bài đăng đã được ${status === 'approved' ? 'phê duyệt' : 'từ chối'}`);
});

module.exports = {
  getUsers,
  updateUserRole,
  toggleUserStatus,
  createVocabulary,
  updateVocabulary,
  deleteVocabulary,
  createReading,
  updateReading,
  deleteReading,
  getPendingCommunityPosts,
  reviewCommunityPost
};
