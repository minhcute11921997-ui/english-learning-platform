const ApiResponse = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const visionService = require('../services/vision.service');

let feedbackTableSynced = false;

/**
 * POST /api/ai/identify
 * Nhận file ảnh mỹ thuật/mỹ nghệ, trả về thuật ngữ tiếng Anh khớp trong DB.
 */
const identifyImage = catchAsync(async (req, res) => {
  if (!req.file || !req.file.buffer) {
    throw new AppError('Vui lòng chọn hoặc kéo thả một hình ảnh để nhận diện.', 400);
  }

  // Strict off-topic rejection if caller attempts to pass free-form text prompts
  const textAttempt = req.body?.prompt || req.body?.question || req.body?.message;
  if (typeof textAttempt === 'string' && textAttempt.trim().length > 0) {
    return ApiResponse.success(
      res,
      {
        status: 'out_of_scope',
        tier: 0,
        cached: false,
        message: 'Chatbox chỉ nhận diện hình ảnh theo 60 thuật ngữ mỹ thuật & mỹ nghệ trong EngLearn, không hỗ trợ hỏi đáp tự do.',
        matches: [],
        facets: []
      },
      'Chỉ hỗ trợ nhận diện hình ảnh mỹ thuật/mỹ nghệ'
    );
  }

  const result = await visionService.identifyImage(req.file.buffer, {
    action: req.body?.action
  });

  if (result.status === 'out_of_scope') {
    return ApiResponse.success(res, result, 'Ảnh nằm ngoài phạm vi mỹ thuật/mỹ nghệ');
  }

  return ApiResponse.success(res, result, 'Nhận diện hình ảnh thành công');
});

/**
 * GET /api/ai/refine/:jobId
 * Lấy kết quả tinh chỉnh bất đồng bộ nếu AI_TIER2_MODE=async
 */
const getRefineStatus = catchAsync(async (req, res) => {
  const job = visionService.getRefineJob(req.params.jobId);
  if (!job) {
    throw new AppError('Không tìm thấy tác vụ tinh chỉnh hoặc đã hết hạn.', 404);
  }
  return ApiResponse.success(res, job, 'Lấy trạng thái tinh chỉnh thành công');
});

/**
 * POST /api/ai/feedback
 * Ghi nhận phản hồi Đúng/Sai của người dùng (không lưu ảnh gốc).
 */
const submitFeedback = catchAsync(async (req, res) => {
  const { imageHash, embId, predictedWord, correctedWord, isCorrect, tier, confidence } = req.body || {};

  if (!imageHash || typeof imageHash !== 'string' || !/^[a-f0-9]{64}$/i.test(imageHash)) {
    throw new AppError('Mã định danh ảnh (imageHash) không hợp lệ.', 400);
  }
  if (typeof isCorrect !== 'boolean') {
    throw new AppError('Thiếu trường xác nhận isCorrect (boolean).', 400);
  }

  let normalizedCorrected = null;
  if (!isCorrect) {
    if (!correctedWord || typeof correctedWord !== 'string' || !correctedWord.trim()) {
      throw new AppError('Vui lòng chọn nhãn đúng khi đánh dấu AI nhận diện sai.', 400);
    }
    const vocabMap = await visionService.getVocabMap();
    const matchedVocab = vocabMap.get(correctedWord.trim().toLowerCase());
    if (!matchedVocab) {
      throw new AppError('Thuật ngữ chỉnh sửa không tồn tại trong hệ thống.', 400);
    }
    normalizedCorrected = matchedVocab.word;
  } else if (correctedWord && typeof correctedWord === 'string') {
    normalizedCorrected = correctedWord.trim().slice(0, 100);
  }

  const { AiFeedback } = require('../models');
  if (!feedbackTableSynced) {
    await AiFeedback.sync();
    feedbackTableSynced = true;
  }

  const record = await AiFeedback.create({
    user_id: req.user.id,
    image_hash: imageHash,
    predicted_word: predictedWord ? String(predictedWord).slice(0, 100) : null,
    corrected_word: normalizedCorrected,
    is_correct: isCorrect,
    tier: typeof tier === 'number' ? tier : null,
    confidence: typeof confidence === 'number' ? confidence : null
  });

  if (embId) {
    visionService
      .forwardFeedbackVector({
        embId,
        predictedWord,
        correctedWord: normalizedCorrected,
        isCorrect
      })
      .catch(() => {});
  }

  return ApiResponse.created(res, { id: record.id }, 'Cảm ơn phản hồi của bạn! Hệ thống đã ghi nhận để cải thiện độ chính xác.');
});

/**
 * GET /api/ai/health
 * Kiểm tra trạng thái AI local (Tier 1 SigLIP + Tier 2 mode + queue metrics)
 */
const getAiHealth = catchAsync(async (req, res) => {
  const health = await visionService.checkHealth();
  return ApiResponse.success(res, health, 'Kiểm tra trạng thái AI thành công');
});

module.exports = {
  identifyImage,
  getRefineStatus,
  submitFeedback,
  getAiHealth
};
