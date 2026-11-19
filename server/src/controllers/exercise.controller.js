const { randomUUID } = require('crypto');
const { Vocabulary, Topic, VocabExample, ExerciseAttempt, User, sequelize } = require('../models');
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
  if (req.query.attemptId) {
    const attempt = await ExerciseAttempt.findOne({ where: { id: req.query.attemptId, user_id: req.user.id, topic_id: topicId } });
    if (!attempt) throw new AppError('Attempt not found.', 404);
    if (attempt.result || new Date(attempt.expires_at) <= new Date()) throw new AppError('Attempt expired or already submitted.', 409);
    return ApiResponse.success(res, publicAttempt(attempt));
  }
  const count = req.query.count === undefined ? 10 : Number(req.query.count);
  if (!Number.isInteger(count) || count < 1 || count > 50) throw new AppError('Count must be between 1 and 50.', 400);

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

  const questions = exercises.map(q => {
    const target = topicVocabs.find(v => v.id === q.vocabulary_id);
    const answer = q.type === 'en_to_vi' ? target.meaning_vi : target.word;
    return { ...q, correct_option: q.options.indexOf(answer) };
  });
  const attempt = await ExerciseAttempt.create({ id: randomUUID(), user_id: req.user.id,
    topic_id: Number(topicId), questions, expires_at: new Date(Date.now() + 24*60*60*1000), result: null });
  return ApiResponse.success(res, publicAttempt(attempt), 'Tạo bài tập củng cố thành công');
});

function publicAttempt(attempt) {
  return { attempt_id: attempt.id, expires_at: attempt.expires_at,
    exercises: attempt.questions.map(({ correct_option, ...question }) => question) };
}

const submitVocabExercises = catchAsync(async (req, res) => {
  const { attempt_id, results } = req.body;
  if (typeof attempt_id !== 'string' || !Array.isArray(results) || results.length < 1 || results.length > 100) {
    throw new AppError('An issued attempt and answers are required.', 400);
  }
  const result = await sequelize.transaction(async t => {
    // Global lock order: user, attempt, progress. Replayed requests return stored results.
    await User.findByPk(req.user.id, { transaction: t, lock: t.LOCK.UPDATE });
    const attempt = await ExerciseAttempt.findOne({ where: { id: attempt_id, user_id: req.user.id },
      transaction: t, lock: t.LOCK.UPDATE });
    if (!attempt) throw new AppError('Attempt not found.', 404);
    if (attempt.result) return attempt.result;
    if (new Date(attempt.expires_at) <= new Date()) throw new AppError('Attempt expired.', 409);
    const questions = attempt.questions;
    const answers = new Map();
    for (const item of results) {
      const q = item && questions.find(q => q.id === item.id);
      if (!q || answers.has(item.id) || (item.selected_option !== null &&
        (!Number.isInteger(item.selected_option) || item.selected_option < 0 || item.selected_option >= q.options.length))) {
        throw new AppError('Invalid or duplicate question/answer.', 400);
      }
      answers.set(item.id, item.selected_option);
    }
    if (answers.size !== questions.length) throw new AppError('Submit every question, using null for unanswered items.', 400);
    const vocabs = await Vocabulary.findAll({ where: { id: questions.map(q => q.vocabulary_id), is_approved: true }, transaction: t });
    const vocabMap = new Map(vocabs.map(v => [v.id, v]));
    if (questions.some(q => !vocabMap.has(q.vocabulary_id))) throw new AppError('A question is no longer available. Start a new attempt.', 409);
    let correct = 0;
    const explanations = [];
    for (const q of questions) {
      const v = vocabMap.get(q.vocabulary_id), selected = answers.get(q.id);
      const isCorrect = selected === q.correct_option;
      if (isCorrect) correct++;
      await SrsService.recordReviewAnswer(req.user.id, q.vocabulary_id, isCorrect ? 4 : 1, { transaction: t });
      explanations.push({ id: q.id, vocabulary_id: v.id, selected_option: selected,
        correct_option: q.correct_option, is_correct: isCorrect,
        ...Object.fromEntries(['word','pronunciation','meaning_vi','image_url','image_alt','cultural_note',
          'related_artist','source_ref','example_sentence','example_translation'].map(key => [key,v[key]])) });
    }
    const scored = { total: questions.length, correct, percentage: Math.round(correct/questions.length*100), explanations };
    attempt.result = scored;
    await attempt.save({ transaction: t });
    return scored;
  });
  return ApiResponse.success(res, result, 'Đã chấm điểm và cập nhật tiến độ ôn tập');
});

module.exports = {
  getVocabExercises,
  submitVocabExercises
};
