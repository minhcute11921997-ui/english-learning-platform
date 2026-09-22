#!/usr/bin/env node
/**
 * ❓ Quiz Question Generator
 * Tự động tạo câu hỏi trắc nghiệm từ dữ liệu từ vựng
 *
 * Usage: node quiz-generator.js <vocabulary.json>
 */

const fs = require('fs');
const path = require('path');

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function generateQuiz(vocabList) {
  const quizzes = [];

  for (const word of vocabList) {
    // Type 1: Chọn nghĩa đúng (EN → VI)
    const wrongMeanings = shuffle(vocabList.filter(w => w.word !== word.word)).slice(0, 3).map(w => w.meaning || w.meaning_vi);
    quizzes.push({
      type: 'choose_meaning',
      question: `What does "${word.word}" mean?`,
      question_vi: `"${word.word}" nghĩa là gì?`,
      options: shuffle([word.meaning || word.meaning_vi, ...wrongMeanings]),
      correct: word.meaning || word.meaning_vi,
      word: word.word,
    });

    // Type 2: Chọn từ đúng (VI → EN)
    const wrongWords = shuffle(vocabList.filter(w => w.word !== word.word)).slice(0, 3).map(w => w.word);
    quizzes.push({
      type: 'choose_word',
      question: `Which word means "${word.meaning || word.meaning_vi}"?`,
      question_vi: `Từ nào có nghĩa "${word.meaning || word.meaning_vi}"?`,
      options: shuffle([word.word, ...wrongWords]),
      correct: word.word,
      meaning: word.meaning || word.meaning_vi,
    });

    // Type 3: Điền từ vào chỗ trống
    if (word.example || word.example_sentence) {
      const sentence = (word.example || word.example_sentence);
      const blanked = sentence.replace(new RegExp(word.word, 'gi'), '___');
      if (blanked !== sentence) {
        quizzes.push({
          type: 'fill_blank',
          question: blanked,
          question_vi: `Điền từ thích hợp vào chỗ trống`,
          options: shuffle([word.word, ...wrongWords.slice(0, 3)]),
          correct: word.word,
        });
      }
    }
  }

  return quizzes;
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.log('Usage: node quiz-generator.js <vocabulary.json>');
    return;
  }

  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const quizzes = generateQuiz(data);

  const outputDir = path.resolve(__dirname, '../output/seed-data');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputFile = path.join(outputDir, 'generated-quizzes.json');
  fs.writeFileSync(outputFile, JSON.stringify(quizzes, null, 2));

  console.log(`❓ Quiz Generator`);
  console.log(`\n✅ Generated ${quizzes.length} questions from ${data.length} vocabulary items`);
  console.log(`📁 Output: ${outputFile}`);
  console.log(`\n📊 By type:`);
  const types = {};
  quizzes.forEach(q => { types[q.type] = (types[q.type] || 0) + 1; });
  Object.entries(types).forEach(([t, c]) => console.log(`  ${t}: ${c}`));
}

main();
