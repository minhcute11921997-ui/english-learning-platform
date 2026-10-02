const {
  UserVocabList,
  UserVocabListItem,
  Vocabulary,
  VocabExample,
  UserVocabProgress,
  ReviewSchedule,
  sequelize
} = require('../models');
const { Op } = require('sequelize');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

/**
 * Lấy danh sách tất cả các bộ từ cá nhân của người dùng
 * GET /api/vocab-lists
 */
const getLists = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const lists = await UserVocabList.findAll({
    where: { user_id: userId },
    attributes: [
      'id',
      'name',
      'description',
      'color',
      'createdAt',
      'updatedAt',
      [
        sequelize.literal(`(
          SELECT COUNT(*)
          FROM user_vocab_list_items AS items
          WHERE items.list_id = UserVocabList.id
        )`),
        'vocab_count'
      ]
    ],
    order: [['updatedAt', 'DESC']]
  });

  return ApiResponse.success(res, lists, 'Lấy danh sách bộ từ thành công');
});

/**
 * Lấy chi tiết một bộ từ kèm danh sách từ vựng bên trong
 * GET /api/vocab-lists/:id
 */
const getListById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const list = await UserVocabList.findOne({
    where: { id, user_id: userId }
  });

  if (!list) {
    throw new AppError('Không tìm thấy danh sách từ vựng', 404);
  }

  // Lấy các từ vựng thuộc danh sách
  const items = await UserVocabListItem.findAll({
    where: { list_id: id },
    include: [
      {
        model: Vocabulary,
        as: 'vocabulary',
        include: [{ model: VocabExample, as: 'examples' }]
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  // Lấy tiến độ học của user cho các từ trong danh sách
  const vocabIds = items.map((i) => i.vocabulary_id).filter(Boolean);
  const progresses = await UserVocabProgress.findAll({
    where: {
      user_id: userId,
      vocabulary_id: { [Op.in]: vocabIds }
    }
  });

  const progressMap = {};
  progresses.forEach((p) => {
    progressMap[p.vocabulary_id] = p;
  });

  const vocabularies = items.map((item) => {
    const v = item.vocabulary?.toJSON() || {};
    v.user_progress = progressMap[v.id] || null;
    v.added_to_list_at = item.createdAt;
    return v;
  });

  return ApiResponse.success(
    res,
    {
      ...list.toJSON(),
      vocabularies
    },
    'Lấy chi tiết danh sách từ thành công'
  );
});

/**
 * Tạo mới một bộ từ cá nhân
 * POST /api/vocab-lists
 */
const createList = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { name, description = '', color = '#195646' } = req.body;

  if (!name || !name.trim()) {
    throw new AppError('Vui lòng nhập tên danh sách từ vựng', 400);
  }

  const newList = await UserVocabList.create({
    user_id: userId,
    name: name.trim(),
    description: description.trim(),
    color
  });

  return ApiResponse.success(res, newList, 'Đã tạo danh sách từ vựng mới', 201);
});

/**
 * Cập nhật tên/mô tả/màu sắc bộ từ
 * PUT /api/vocab-lists/:id
 */
const updateList = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { name, description, color } = req.body;

  const list = await UserVocabList.findOne({
    where: { id, user_id: userId }
  });

  if (!list) {
    throw new AppError('Không tìm thấy danh sách từ vựng', 404);
  }

  if (name !== undefined) {
    if (!name.trim()) throw new AppError('Tên danh sách không được để trống', 400);
    list.name = name.trim();
  }
  if (description !== undefined) list.description = description.trim();
  if (color !== undefined) list.color = color;

  await list.save();

  return ApiResponse.success(res, list, 'Cập nhật danh sách từ thành công');
});

/**
 * Xóa một bộ từ cá nhân
 * DELETE /api/vocab-lists/:id
 */
const deleteList = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const list = await UserVocabList.findOne({
    where: { id, user_id: userId }
  });

  if (!list) {
    throw new AppError('Không tìm thấy danh sách từ vựng', 404);
  }

  await list.destroy();

  return ApiResponse.success(res, null, 'Đã xóa danh sách từ vựng');
});

/**
 * Thêm một từ vào một hoặc nhiều danh sách (và có thể đồng bộ gỡ khỏi danh sách bỏ chọn)
 * POST /api/vocab-lists/words/sync
 * Body: { vocabulary_id, word, meaning_vi, pronunciation, part_of_speech, list_ids: [1, 2], auto_learn?: true }
 */
const addWordToLists = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const {
    vocabulary_id,
    word,
    meaning_vi,
    pronunciation,
    part_of_speech,
    list_ids = [],
    auto_learn = true
  } = req.body;

  let targetVocabId = vocabulary_id;

  // Nếu không có vocabulary_id nhưng có từ (ví dụ lưu từ popup bôi đen)
  if (!targetVocabId && word) {
    const cleanWord = word.trim().toLowerCase();
    let existing = await Vocabulary.findOne({ where: { word: cleanWord } });
    if (!existing) {
      existing = await Vocabulary.create({
        word: cleanWord,
        meaning_vi: meaning_vi || cleanWord,
        pronunciation: pronunciation || '',
        part_of_speech: part_of_speech || 'noun',
        difficulty: 'medium',
        is_approved: true,
        created_by: userId
      });
    }
    targetVocabId = existing.id;
  }

  if (!targetVocabId) {
    throw new AppError('Vui lòng cung cấp từ vựng cần lưu', 400);
  }

  // Lấy tất cả danh sách của user này để kiểm tra quyền
  const userLists = await UserVocabList.findAll({
    where: { user_id: userId },
    attributes: ['id']
  });
  const userListIds = userLists.map((l) => l.id);

  // Lọc chỉ giữ lại list_ids thuộc quyền sở hữu của user
  const validTargetListIds = (Array.isArray(list_ids) ? list_ids : [])
    .map(Number)
    .filter((id) => userListIds.includes(id));

  // 1. Thêm vào các danh sách được chọn
  for (const listId of validTargetListIds) {
    await UserVocabListItem.findOrCreate({
      where: { list_id: listId, vocabulary_id: targetVocabId }
    });
  }

  // 2. Gỡ khỏi các danh sách của user mà không nằm trong validTargetListIds
  if (userListIds.length > 0) {
    await UserVocabListItem.destroy({
      where: {
        vocabulary_id: targetVocabId,
        list_id: {
          [Op.in]: userListIds,
          [Op.notIn]: validTargetListIds
        }
      }
    });
  }

  // 3. Tự động khởi tạo tiến độ học & lịch SRS cho từ này nếu chưa có
  if (auto_learn) {
    const existingProgress = await UserVocabProgress.findOne({
      where: { user_id: userId, vocabulary_id: targetVocabId }
    });
    if (!existingProgress) {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await UserVocabProgress.create({
        user_id: userId,
        vocabulary_id: targetVocabId,
        status: 'learning',
        correct_count: 1,
        incorrect_count: 0,
        ease_factor: 2.5,
        interval_days: 1,
        repetition_count: 1,
        last_reviewed_at: new Date(),
        next_review_at: tomorrow
      });

      await ReviewSchedule.create({
        user_id: userId,
        vocabulary_id: targetVocabId,
        scheduled_at: tomorrow,
        is_completed: false,
        source: 'personal'
      });
    }
  }

  return ApiResponse.success(
    res,
    {
      vocabulary_id: targetVocabId,
      assigned_list_ids: validTargetListIds
    },
    'Đã cập nhật danh sách lưu từ vựng'
  );
});

/**
 * Xóa một từ khỏi một danh sách cụ thể
 * DELETE /api/vocab-lists/:listId/words/:vocabId
 */
const removeWordFromList = catchAsync(async (req, res) => {
  const { listId, vocabId } = req.params;
  const userId = req.user.id;

  const list = await UserVocabList.findOne({
    where: { id: listId, user_id: userId }
  });

  if (!list) {
    throw new AppError('Không tìm thấy danh sách từ vựng', 404);
  }

  await UserVocabListItem.destroy({
    where: { list_id: listId, vocabulary_id: vocabId }
  });

  return ApiResponse.success(res, null, 'Đã xóa từ khỏi danh sách');
});

/**
 * Lấy danh sách các ID của list mà một từ vựng đang thuộc về
 * GET /api/vocab-lists/words/membership?vocabId=...&word=...
 */
const getWordMembership = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { vocabId, word } = req.query;

  let targetId = vocabId ? parseInt(vocabId) : null;
  if (!targetId && word) {
    const vocab = await Vocabulary.findOne({
      where: { word: word.trim().toLowerCase() }
    });
    if (vocab) targetId = vocab.id;
  }

  if (!targetId) {
    return ApiResponse.success(res, { listIds: [] });
  }

  const items = await UserVocabListItem.findAll({
    where: { vocabulary_id: targetId },
    include: [
      {
        model: UserVocabList,
        as: 'list',
        where: { user_id: userId },
        attributes: ['id']
      }
    ]
  });

  const listIds = items.map((i) => i.list_id);

  return ApiResponse.success(res, { listIds, vocabulary_id: targetId });
});

module.exports = {
  getLists,
  getListById,
  createList,
  updateList,
  deleteList,
  addWordToLists,
  removeWordFromList,
  getWordMembership
};
