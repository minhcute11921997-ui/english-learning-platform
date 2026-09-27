const { CommunityPost, User } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Gửi nội dung đóng góp cộng đồng (chờ duyệt)
const submitPost = catchAsync(async (req, res) => {
  const { content_type, title, description, content_ids } = req.body;
  const userId = req.user.id;

  if (!['vocab_set', 'reading'].includes(content_type)) {
    throw new AppError('Loại nội dung phải là "vocab_set" hoặc "reading".', 400);
  }

  const post = await CommunityPost.create({
    user_id: userId,
    content_type,
    title,
    description,
    content_ids: content_ids || [],
    status: 'pending'
  });

  return ApiResponse.created(res, post, 'Nội dung đã được gửi và đang chờ kiểm duyệt từ ban quản trị');
});

// Lấy danh sách bài đã được duyệt cho toàn bộ cộng đồng
const getApprovedPosts = catchAsync(async (req, res) => {
  const { content_type, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const where = { status: 'approved' };
  if (content_type) where.content_type = content_type;

  const { rows: posts, count: total } = await CommunityPost.findAndCountAll({
    where,
    include: [
      { model: User, as: 'author', attributes: ['id', 'username', 'full_name', 'avatar_url'] }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['upvote_count', 'DESC'], ['created_at', 'DESC']]
  });

  return ApiResponse.paginated(
    res,
    posts,
    { page: parseInt(page), limit: parseInt(limit), total },
    'Lấy danh sách bài cộng đồng thành công'
  );
});

// Lấy các bài do người dùng hiện tại đã đăng
const getMyPosts = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const posts = await CommunityPost.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']]
  });

  return ApiResponse.success(res, posts, 'Lấy danh sách bài đã gửi thành công');
});

// Bình chọn / Thích bài viết
const upvotePost = catchAsync(async (req, res) => {
  const { id } = req.params;
  const post = await CommunityPost.findByPk(id);

  if (!post || post.status !== 'approved') {
    throw new AppError('Không tìm thấy bài viết cộng đồng.', 404);
  }

  post.upvote_count = (post.upvote_count || 0) + 1;
  await post.save();

  return ApiResponse.success(res, { upvote_count: post.upvote_count }, 'Bình chọn thành công');
});

module.exports = {
  submitPost,
  getApprovedPosts,
  getMyPosts,
  upvotePost
};
