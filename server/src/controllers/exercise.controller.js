const { Vocabulary, Topic, VocabExample } = require('../models');
const SrsService = require('../services/srs.service');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Trộn ngẫu nhiên mảng
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const getVocabExercises = catchAsync(async (req, res) => {
  const { topicId } = req.params;
  const count = parseInt(req.query.count) || 10;

  const topicVocabs = await Vocabulary.findAll({
    where: { topic_id: topicId, is_approved: true },
    include: [{ model: VocabExample, as: 'examples' }]
  });

  if (topicVocabs.length < 4) {
    throw new AppError('Chủ đề này chưa có đủ từ vựng để tạo bài tập (tối thiểu 4 từ).', 400);
  }

  const allWords = shuffle(topicVocabs);
  const selectedWords = allWords.slice(0, Math.min(count, allWords.length));
  const exercises = [];

  for (let i = 0; i < selectedWords.length; i++) {
    const target = selectedWords[i];
    // 0: en-vi, 1: vi-en, 2: fill-blank, 3: image_to_word (nếu có ảnh)
    let type = i % 4;
    if (type === 3 && !target.image_url) {
      type = 0;
    }

    // Lấy 3 distractors
    const otherWords = allWords.filter((w) => w.id !== target.id);
    const distractors = shuffle(otherWords).slice(0, 3);

    if (type === 3 && target.image_url) {
      // Nhìn tranh đoán từ vựng / thuật ngữ (KHÔNG gửi meaning_vi hoặc cultural_note trước khi trả lời)
      const options = shuffle([
        target.word,
        distractors[0].word,
        distractors[1].word,
        distractors[2].word
      ]);
      exercises.push({
        id: i + 1,
        vocabulary_id: target.id,
        type: 'image_to_word',
        question: 'Hình ảnh minh họa sau đây thể hiện thuật ngữ mỹ thuật/thủ công nào?',
        image_url: target.image_url,
        options
      });
    } else if (type === 0) {
      // English to Vietnamese (chỉ gửi câu hỏi, không kèm ảnh hay bối cảnh để lộ đáp án)
      const options = shuffle([
        target.meaning_vi,
        distractors[0].meaning_vi,
        distractors[1].meaning_vi,
        distractors[2].meaning_vi
      ]);
      exercises.push({
        id: i + 1,
        vocabulary_id: target.id,
        type: 'en_to_vi',
        question: `Thuật ngữ "${target.word}" có nghĩa là gì?`,
        pronunciation: target.pronunciation,
        part_of_speech: target.part_of_speech,
        options
      });
    } else if (type === 1) {
      // Vietnamese to English
      const options = shuffle([
        target.word,
        distractors[0].word,
        distractors[1].word,
        distractors[2].word
      ]);
      exercises.push({
        id: i + 1,
        vocabulary_id: target.id,
        type: 'vi_to_en',
        question: `Thuật ngữ tiếng Anh nào diễn đạt: "${target.meaning_vi}"?`,
        part_of_speech: target.part_of_speech,
        options
      });
    } else {
      // Fill-in-the-blank using example sentence
      let sentence = target.example_sentence;
      if (sentence && sentence.toLowerCase().includes(target.word.toLowerCase())) {
        const escapedWord = target.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
        const blankSentence = sentence.replace(regex, '______');
        const options = shuffle([
          target.word,
          distractors[0].word,
          distractors[1].word,
          distractors[2].word
        ]);
        exercises.push({
          id: i + 1,
          vocabulary_id: target.id,
          type: 'fill_blank',
          question: `Điền từ thích hợp vào chỗ trống trong ngữ cảnh mỹ thuật:\n"${blankSentence}"`,
          translation: target.example_translation,
          options
        });
      } else {
        const options = shuffle([
          target.meaning_vi,
          distractors[0].meaning_vi,
          distractors[1].meaning_vi,
          distractors[2].meaning_vi
        ]);
        exercises.push({
          id: i + 1,
          vocabulary_id: target.id,
          type: 'en_to_vi',
          question: `Thuật ngữ "${target.word}" có nghĩa là gì?`,
          options
        });
      }
    }
  }

  return ApiResponse.success(res, exercises, 'Tạo bài tập củng cố thành công');
});

const submitVocabExercises = catchAsync(async (req, res) => {
  const { results } = req.body; // array: [{ id, vocabulary_id, selected_option, options, is_correct, quality }]
  if (!results || !Array.isArray(results)) {
    throw new AppError('Dữ liệu nộp bài không hợp lệ.', 400);
  }

  const userId = req.user.id;
  const vocabIds = results.map((r) => r.vocabulary_id);
  const vocabs = await Vocabulary.findAll({
    where: { id: vocabIds }
  });
  const vocabMap = {};
  vocabs.forEach((v) => {
    vocabMap[v.id] = v;
  });

  let correctCount = 0;
  const explanations = [];

  for (const item of results) {
    const v = vocabMap[item.vocabulary_id];
    let isCorrect = false;

    // Server-side scoring check
    if (item.options && Array.isArray(item.options) && item.selected_option !== undefined && item.selected_option !== null && item.selected_option >= 0) {
      const chosen = item.options[item.selected_option];
      if (v && (chosen === v.word || chosen === v.meaning_vi)) {
        isCorrect = true;
      }
    } else if (typeof item.is_correct === 'boolean') {
      // Fallback for direct boolean test payloads
      isCorrect = item.is_correct;
    }

    if (isCorrect) correctCount++;
    const quality = item.quality !== undefined ? item.quality : (isCorrect ? 4 : 1);
    await SrsService.recordReviewAnswer(userId, item.vocabulary_id, quality);

    // Tìm index của đáp án chính xác trong options gửi lên
    let correctOptionIdx = -1;
    if (v && item.options && Array.isArray(item.options)) {
      correctOptionIdx = item.options.findIndex((opt) => opt === v.word || opt === v.meaning_vi);
    }

    explanations.push({
      id: item.id,
      vocabulary_id: item.vocabulary_id,
      selected_option: item.selected_option,
      correct_option: correctOptionIdx,
      is_correct: isCorrect,
      word: v?.word,
      pronunciation: v?.pronunciation,
      meaning_vi: v?.meaning_vi,
      image_url: v?.image_url,
      image_alt: v?.image_alt,
      cultural_note: v?.cultural_note,
      related_artist: v?.related_artist,
      source_ref: v?.source_ref,
      example_sentence: v?.example_sentence,
      example_translation: v?.example_translation
    });
  }

  return ApiResponse.success(res, {
    total: results.length,
    correct: correctCount,
    percentage: results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0,
    explanations
  }, 'Đã chấm điểm và cập nhật tiến độ ôn tập');
});

module.exports = {
  getVocabExercises,
  submitVocabExercises
};
