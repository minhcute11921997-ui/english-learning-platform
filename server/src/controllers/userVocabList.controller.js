const {
  User,
  Topic,
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
  const { vocabulary_id, word, meaning_vi, pronunciation, part_of_speech, list_ids = [], auto_learn = true } = req.body;
  if (!Array.isArray(list_ids) || list_ids.some(id => !Number.isInteger(Number(id)) || Number(id) < 1)) {
    throw new AppError('Invalid list IDs.', 400);
  }
  const result = await sequelize.transaction(async t => {
    await User.findByPk(userId, {transaction:t,lock:t.LOCK.UPDATE});
    const userLists = await UserVocabList.findAll({where:{user_id:userId},transaction:t});
    const userListIds = userLists.map(l=>l.id);
    const targetIds = [...new Set(list_ids.map(Number))];
    if (targetIds.some(id=>!userListIds.includes(id))) throw new AppError('List not found.',404);
    let vocab;
    if (vocabulary_id) {
      vocab = await Vocabulary.findByPk(vocabulary_id,{transaction:t});
      if (!vocab || (!vocab.is_approved && vocab.created_by !== userId)) throw new AppError('Vocabulary not found.',404);
    } else {
      if (typeof word !== 'string' || !word.trim() || word.trim().length > 100) throw new AppError('Invalid word.',400);
      const cleanWord = word.trim().toLowerCase();
      vocab = await Vocabulary.findOne({where:{word:cleanWord,[Op.or]:[{is_approved:true},{created_by:userId}]},transaction:t});
      if (!vocab) {
        const [topic] = await Topic.findOrCreate({where:{name:'Personal Vocabulary'},defaults:{name_vi:'Từ cá nhân',display_order:999},transaction:t});
        vocab = await Vocabulary.create({topic_id:topic.id,word:cleanWord,meaning_vi:meaning_vi || cleanWord,
          pronunciation:pronunciation || '',part_of_speech:part_of_speech || 'noun',difficulty:'medium',
          source_type:'community',is_approved:false,created_by:userId},{transaction:t});
      }
    }
    for (const listId of targetIds) await UserVocabListItem.findOrCreate({where:{list_id:listId,vocabulary_id:vocab.id},transaction:t});
    if (userListIds.length) await UserVocabListItem.destroy({where:{vocabulary_id:vocab.id,
      list_id:{[Op.in]:userListIds,[Op.notIn]:targetIds}},transaction:t});
    if (auto_learn && targetIds.length) {
      const [progress,created] = await UserVocabProgress.findOrCreate({where:{user_id:userId,vocabulary_id:vocab.id},
        defaults:{status:'learning',correct_count:0,incorrect_count:0,ease_factor:2.5,interval_days:1,repetition_count:0,
          next_review_at:new Date(Date.now()+86400000)},transaction:t});
      if(created) await ReviewSchedule.create({user_id:userId,vocabulary_id:vocab.id,
        scheduled_at:progress.next_review_at,is_completed:false,source:'personal'},{transaction:t});
    }
    return {vocabulary_id:vocab.id,assigned_list_ids:targetIds};
  });
  return ApiResponse.success(res,result,'Đã cập nhật danh sách lưu từ vựng');
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
