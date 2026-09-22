const {
  Group,
  GroupMember,
  GroupVocabSet,
  GroupVocabItem,
  GroupReadingSet,
  User,
  Vocabulary,
  Reading,
  UserVocabProgress,
  UserReadingAttempt,
  ReviewSchedule
} = require('../models');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Tạo nhóm học mới
const createGroup = catchAsync(async (req, res) => {
  const { name, description } = req.body;
  const ownerId = req.user.id;

  const group = await Group.create({
    owner_id: ownerId,
    name,
    description
  });

  // Tự động thêm owner vào danh sách thành viên
  await GroupMember.create({
    group_id: group.id,
    user_id: ownerId,
    role: 'owner'
  });

  return ApiResponse.created(res, group, 'Tạo nhóm học tập thành công');
});

// Lấy danh sách nhóm của tôi (nhóm sở hữu và nhóm tham gia)
const getMyGroups = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const memberships = await GroupMember.findAll({
    where: { user_id: userId },
    include: [
      {
        model: Group,
        as: 'group',
        include: [{ model: User, as: 'owner', attributes: ['id', 'username', 'full_name', 'avatar_url'] }]
      }
    ]
  });

  const groups = memberships.map((m) => ({
    ...m.group.toJSON(),
    member_role: m.role,
    joined_at: m.joined_at
  }));

  return ApiResponse.success(res, groups, 'Lấy danh sách nhóm của bạn thành công');
});

// Lấy chi tiết nhóm, danh sách thành viên và nội dung học
const getGroupById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const group = await Group.findByPk(id, {
    include: [
      { model: User, as: 'owner', attributes: ['id', 'username', 'full_name', 'avatar_url'] },
      {
        model: GroupMember,
        as: 'members',
        include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url'] }]
      },
      {
        model: GroupVocabSet,
        as: 'vocabSets',
        include: [
          {
            model: GroupVocabItem,
            as: 'items',
            include: [{ model: Vocabulary, as: 'vocabulary' }]
          }
        ]
      },
      {
        model: GroupReadingSet,
        as: 'readingSets',
        include: [{ model: Reading, as: 'reading' }]
      }
    ]
  });

  if (!group) {
    throw new AppError('Không tìm thấy nhóm học tập.', 404);
  }

  // Kiểm tra user có phải thành viên không
  const isMember = group.members.some((m) => m.user_id === userId);
  const isOwner = group.owner_id === userId;

  return ApiResponse.success(
    res,
    {
      ...group.toJSON(),
      is_member: isMember,
      is_owner: isOwner
    },
    'Lấy chi tiết nhóm học thành công'
  );
});

// Tham gia nhóm bằng mã mời
const joinGroup = catchAsync(async (req, res) => {
  const { invite_code } = req.body;
  const userId = req.user.id;

  if (!invite_code) {
    throw new AppError('Vui lòng nhập mã mời.', 400);
  }

  const group = await Group.findOne({
    where: { invite_code: invite_code.trim().toUpperCase(), is_active: true }
  });

  if (!group) {
    throw new AppError('Mã mời không hợp lệ hoặc nhóm đã ngừng hoạt động.', 404);
  }

  const existingMember = await GroupMember.findOne({
    where: { group_id: group.id, user_id: userId }
  });

  if (existingMember) {
    throw new AppError('Bạn đã là thành viên của nhóm này rồi.', 400);
  }

  await GroupMember.create({
    group_id: group.id,
    user_id: userId,
    role: 'member'
  });

  // Tự động đồng bộ các bộ từ vựng đã phát hành trong nhóm vào lịch ôn tập cá nhân
  const publishedVocabSets = await GroupVocabSet.findAll({
    where: { group_id: group.id, is_published: true },
    include: [{ model: GroupVocabItem, as: 'items' }]
  });

  for (const vSet of publishedVocabSets) {
    for (const item of vSet.items) {
      await ReviewSchedule.findOrCreate({
        where: {
          user_id: userId,
          vocabulary_id: item.vocabulary_id,
          group_vocab_set_id: vSet.id
        },
        defaults: {
          user_id: userId,
          vocabulary_id: item.vocabulary_id,
          scheduled_at: new Date(),
          is_completed: false,
          source: 'group',
          group_vocab_set_id: vSet.id
        }
      });
    }
  }

  return ApiResponse.success(res, group, 'Tham gia nhóm học tập thành công');
});

// Xóa thành viên khỏi nhóm
const removeMember = catchAsync(async (req, res) => {
  const { id, userId } = req.params;
  const currentUserId = req.user.id;

  const group = await Group.findByPk(id);
  if (!group) throw new AppError('Không tìm thấy nhóm.', 404);

  // Chỉ chủ nhóm hoặc chính thành viên đó (tự rời nhóm) mới có quyền xóa
  if (group.owner_id !== currentUserId && currentUserId !== parseInt(userId)) {
    throw new AppError('Bạn không có quyền xóa thành viên này.', 403);
  }

  // Không cho phép chủ nhóm tự xóa chính mình nếu chưa chuyển quyền
  if (group.owner_id === parseInt(userId)) {
    throw new AppError('Chủ nhóm không thể rời nhóm khi chưa chuyển quyền sở hữu.', 400);
  }

  await GroupMember.destroy({
    where: { group_id: id, user_id: userId }
  });

  return ApiResponse.success(res, null, 'Đã xóa thành viên khỏi nhóm');
});

// Chỉnh sửa thông tin nhóm
const updateGroup = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const group = await Group.findByPk(id);

  if (!group) throw new AppError('Không tìm thấy nhóm.', 404);
  if (group.owner_id !== req.user.id) {
    throw new AppError('Chỉ chủ nhóm mới có quyền chỉnh sửa nhóm.', 403);
  }

  if (name) group.name = name;
  if (description !== undefined) group.description = description;

  await group.save();
  return ApiResponse.success(res, group, 'Cập nhật thông tin nhóm thành công');
});

// Tạo lại mã mời
const regenerateInviteCode = catchAsync(async (req, res) => {
  const { id } = req.params;
  const group = await Group.findByPk(id);

  if (!group) throw new AppError('Không tìm thấy nhóm.', 404);
  if (group.owner_id !== req.user.id) {
    throw new AppError('Chỉ chủ nhóm mới có quyền đổi mã mời.', 403);
  }

  const newCode = await group.regenerateInviteCode();
  return ApiResponse.success(res, { invite_code: newCode }, 'Tạo lại mã mời thành công');
});

// Tạo bộ từ vựng cho nhóm
const createGroupVocabSet = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { title, description, vocabulary_ids = [] } = req.body;

  const group = await Group.findByPk(id);
  if (!group) throw new AppError('Không tìm thấy nhóm.', 404);
  if (group.owner_id !== req.user.id) {
    throw new AppError('Chỉ chủ nhóm mới có quyền tạo bộ từ vựng.', 403);
  }

  const vocabSet = await GroupVocabSet.create({
    group_id: parseInt(id),
    created_by: req.user.id,
    title,
    description,
    is_published: false
  });

  for (let i = 0; i < vocabulary_ids.length; i++) {
    await GroupVocabItem.create({
      vocab_set_id: vocabSet.id,
      vocabulary_id: vocabulary_ids[i],
      display_order: i
    });
  }

  return ApiResponse.created(res, vocabSet, 'Tạo bộ từ vựng nhóm thành công');
});

// Phát hành bộ từ vựng cho thành viên và đẩy vào lịch ôn tập
const publishGroupVocabSet = catchAsync(async (req, res) => {
  const { id, setId } = req.params;
  const vocabSet = await GroupVocabSet.findOne({
    where: { id: setId, group_id: id },
    include: [{ model: GroupVocabItem, as: 'items' }]
  });

  if (!vocabSet) throw new AppError('Không tìm thấy bộ từ vựng.', 404);

  vocabSet.is_published = true;
  await vocabSet.save();

  // Đẩy từ vựng vào lịch ôn tập của toàn bộ thành viên nhóm
  const members = await GroupMember.findAll({ where: { group_id: id } });
  for (const member of members) {
    for (const item of vocabSet.items) {
      await ReviewSchedule.findOrCreate({
        where: {
          user_id: member.user_id,
          vocabulary_id: item.vocabulary_id,
          group_vocab_set_id: vocabSet.id
        },
        defaults: {
          user_id: member.user_id,
          vocabulary_id: item.vocabulary_id,
          scheduled_at: new Date(),
          is_completed: false,
          source: 'group',
          group_vocab_set_id: vocabSet.id
        }
      });
    }
  }

  return ApiResponse.success(res, vocabSet, 'Đã phát hành bộ từ vựng cho nhóm');
});

// Chia sẻ bài đọc cho nhóm
const addGroupReading = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reading_id } = req.body;

  const reading = await Reading.findByPk(reading_id);
  if (!reading) throw new AppError('Không tìm thấy bài đọc.', 404);

  const [readingSet] = await GroupReadingSet.findOrCreate({
    where: { group_id: id, reading_id },
    defaults: {
      group_id: parseInt(id),
      reading_id,
      created_by: req.user.id,
      is_published: true
    }
  });

  return ApiResponse.created(res, readingSet, 'Đã chia sẻ bài đọc cho nhóm');
});

// Theo dõi tiến độ nhóm (dành cho chủ nhóm)
const getGroupProgress = catchAsync(async (req, res) => {
  const { id } = req.params;
  const group = await Group.findByPk(id, {
    include: [
      {
        model: GroupMember,
        as: 'members',
        include: [{ model: User, as: 'user', attributes: ['id', 'username', 'full_name'] }]
      },
      {
        model: GroupVocabSet,
        as: 'vocabSets',
        include: [{ model: GroupVocabItem, as: 'items' }]
      },
      {
        model: GroupReadingSet,
        as: 'readingSets'
      }
    ]
  });

  if (!group) throw new AppError('Không tìm thấy nhóm.', 404);

  // Tính tổng số từ trong các bộ từ nhóm
  let totalVocabInGroup = 0;
  group.vocabSets.forEach((vs) => {
    totalVocabInGroup += vs.items.length;
  });

  const totalReadingsInGroup = group.readingSets.length;

  const memberProgress = [];

  for (const m of group.members) {
    const user = m.user;

    // Tiến độ học từ vựng nhóm
    let learnedVocabCount = 0;
    if (totalVocabInGroup > 0) {
      const vocabIds = [];
      group.vocabSets.forEach((vs) => {
        vs.items.forEach((item) => vocabIds.push(item.vocabulary_id));
      });

      learnedVocabCount = await UserVocabProgress.count({
        where: {
          user_id: user.id,
          vocabulary_id: vocabIds
        }
      });
    }

    // Tiến độ bài đọc nhóm
    let completedReadingsCount = 0;
    if (totalReadingsInGroup > 0) {
      const readingIds = group.readingSets.map((rs) => rs.reading_id);
      completedReadingsCount = await UserReadingAttempt.count({
        where: {
          user_id: user.id,
          reading_id: readingIds
        },
        distinct: true,
        col: 'reading_id'
      });
    }

    memberProgress.push({
      user_id: user.id,
      full_name: user.full_name,
      username: user.username,
      role: m.role,
      vocab_progress: {
        total: totalVocabInGroup,
        learned: learnedVocabCount,
        percent: totalVocabInGroup > 0 ? Math.round((learnedVocabCount / totalVocabInGroup) * 100) : 0
      },
      reading_progress: {
        total: totalReadingsInGroup,
        completed: completedReadingsCount,
        percent: totalReadingsInGroup > 0 ? Math.round((completedReadingsCount / totalReadingsInGroup) * 100) : 0
      }
    });
  }

  return ApiResponse.success(
    res,
    {
      group_id: group.id,
      group_name: group.name,
      total_members: group.members.length,
      members: memberProgress
    },
    'Lấy tiến độ nhóm học tập thành công'
  );
});

module.exports = {
  createGroup,
  getMyGroups,
  getGroupById,
  joinGroup,
  removeMember,
  updateGroup,
  regenerateInviteCode,
  createGroupVocabSet,
  publishGroupVocabSet,
  addGroupReading,
  getGroupProgress
};
