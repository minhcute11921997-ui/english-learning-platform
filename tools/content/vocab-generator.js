#!/usr/bin/env node
/**
 * 📝 Vocabulary Data Generator
 * Tạo dữ liệu từ vựng mẫu theo chủ đề
 *
 * Usage:
 *   node vocab-generator.js --topic family --count 30
 *   node vocab-generator.js --all
 */

const fs = require('fs');
const path = require('path');

const VOCAB_DATA = {
  about_me: [
    { word: 'name', type: 'noun', meaning: 'tên', example: 'My name is Linh.' },
    { word: 'age', type: 'noun', meaning: 'tuổi', example: 'I am 15 years old.' },
    { word: 'student', type: 'noun', meaning: 'học sinh', example: 'I am a student.' },
    { word: 'tall', type: 'adj', meaning: 'cao', example: 'My brother is very tall.' },
    { word: 'short', type: 'adj', meaning: 'thấp/ngắn', example: 'She has short hair.' },
    { word: 'happy', type: 'adj', meaning: 'vui vẻ', example: 'I feel happy today.' },
    { word: 'sad', type: 'adj', meaning: 'buồn', example: 'She looks sad.' },
    { word: 'friendly', type: 'adj', meaning: 'thân thiện', example: 'He is very friendly.' },
    { word: 'young', type: 'adj', meaning: 'trẻ', example: 'She is young and energetic.' },
    { word: 'old', type: 'adj', meaning: 'già', example: 'My grandfather is old.' },
    { word: 'beautiful', type: 'adj', meaning: 'đẹp', example: 'She is beautiful.' },
    { word: 'handsome', type: 'adj', meaning: 'đẹp trai', example: 'He is handsome.' },
    { word: 'smart', type: 'adj', meaning: 'thông minh', example: 'She is very smart.' },
    { word: 'kind', type: 'adj', meaning: 'tốt bụng', example: 'He is kind to everyone.' },
    { word: 'live', type: 'verb', meaning: 'sống', example: 'I live in Ho Chi Minh City.' },
  ],
  family: [
    { word: 'mother', type: 'noun', meaning: 'mẹ', example: 'My mother cooks very well.' },
    { word: 'father', type: 'noun', meaning: 'bố/cha', example: 'My father works at a bank.' },
    { word: 'sister', type: 'noun', meaning: 'chị/em gái', example: 'I have one sister.' },
    { word: 'brother', type: 'noun', meaning: 'anh/em trai', example: 'My brother is a student.' },
    { word: 'grandmother', type: 'noun', meaning: 'bà', example: 'My grandmother is 70 years old.' },
    { word: 'grandfather', type: 'noun', meaning: 'ông', example: 'My grandfather likes reading.' },
    { word: 'uncle', type: 'noun', meaning: 'chú/bác/cậu', example: 'My uncle lives in Da Nang.' },
    { word: 'aunt', type: 'noun', meaning: 'cô/dì/mợ', example: 'My aunt is a teacher.' },
    { word: 'cousin', type: 'noun', meaning: 'anh/chị/em họ', example: 'I play with my cousin.' },
    { word: 'parents', type: 'noun', meaning: 'bố mẹ', example: 'My parents love me very much.' },
    { word: 'family', type: 'noun', meaning: 'gia đình', example: 'I have a big family.' },
    { word: 'love', type: 'verb', meaning: 'yêu thương', example: 'I love my family.' },
    { word: 'take care', type: 'phrase', meaning: 'chăm sóc', example: 'She takes care of her baby.' },
    { word: 'daughter', type: 'noun', meaning: 'con gái', example: 'She has two daughters.' },
    { word: 'son', type: 'noun', meaning: 'con trai', example: 'He has one son.' },
  ],
  school: [
    { word: 'teacher', type: 'noun', meaning: 'giáo viên', example: 'My teacher is very kind.' },
    { word: 'classroom', type: 'noun', meaning: 'lớp học', example: 'Our classroom is big.' },
    { word: 'book', type: 'noun', meaning: 'sách', example: 'I read a book every day.' },
    { word: 'pen', type: 'noun', meaning: 'bút', example: 'I need a pen to write.' },
    { word: 'pencil', type: 'noun', meaning: 'bút chì', example: 'She draws with a pencil.' },
    { word: 'notebook', type: 'noun', meaning: 'vở', example: 'Open your notebook.' },
    { word: 'exam', type: 'noun', meaning: 'bài kiểm tra', example: 'The exam is tomorrow.' },
    { word: 'study', type: 'verb', meaning: 'học', example: 'I study English every day.' },
    { word: 'learn', type: 'verb', meaning: 'học/tiếp thu', example: 'I want to learn new words.' },
    { word: 'homework', type: 'noun', meaning: 'bài tập về nhà', example: 'I do homework after school.' },
    { word: 'subject', type: 'noun', meaning: 'môn học', example: 'Math is my favorite subject.' },
    { word: 'library', type: 'noun', meaning: 'thư viện', example: 'I go to the library to read.' },
    { word: 'school', type: 'noun', meaning: 'trường học', example: 'I go to school at 7 AM.' },
    { word: 'friend', type: 'noun', meaning: 'bạn bè', example: 'She is my best friend.' },
    { word: 'write', type: 'verb', meaning: 'viết', example: 'Please write your name.' },
  ],
  food: [
    { word: 'rice', type: 'noun', meaning: 'cơm/gạo', example: 'Vietnamese people eat rice every day.' },
    { word: 'chicken', type: 'noun', meaning: 'gà/thịt gà', example: 'I like fried chicken.' },
    { word: 'fish', type: 'noun', meaning: 'cá', example: 'Fish is good for health.' },
    { word: 'water', type: 'noun', meaning: 'nước', example: 'Please drink more water.' },
    { word: 'fruit', type: 'noun', meaning: 'trái cây', example: 'I eat fruit every morning.' },
    { word: 'vegetable', type: 'noun', meaning: 'rau', example: 'Vegetables are healthy.' },
    { word: 'bread', type: 'noun', meaning: 'bánh mì', example: 'I eat bread for breakfast.' },
    { word: 'milk', type: 'noun', meaning: 'sữa', example: 'Children drink milk every day.' },
    { word: 'egg', type: 'noun', meaning: 'trứng', example: 'She eats two eggs for breakfast.' },
    { word: 'delicious', type: 'adj', meaning: 'ngon', example: 'This food is delicious!' },
    { word: 'hungry', type: 'adj', meaning: 'đói', example: 'I am very hungry.' },
    { word: 'thirsty', type: 'adj', meaning: 'khát', example: 'Are you thirsty?' },
    { word: 'cook', type: 'verb', meaning: 'nấu ăn', example: 'My mother cooks dinner.' },
    { word: 'eat', type: 'verb', meaning: 'ăn', example: 'We eat lunch at noon.' },
    { word: 'drink', type: 'verb', meaning: 'uống', example: 'I drink juice every day.' },
  ],
  hobbies: [
    { word: 'play', type: 'verb', meaning: 'chơi', example: 'I play football after school.' },
    { word: 'sing', type: 'verb', meaning: 'hát', example: 'She likes to sing.' },
    { word: 'draw', type: 'verb', meaning: 'vẽ', example: 'He draws very well.' },
    { word: 'read', type: 'verb', meaning: 'đọc', example: 'I read books every night.' },
    { word: 'swim', type: 'verb', meaning: 'bơi', example: 'I can swim fast.' },
    { word: 'dance', type: 'verb', meaning: 'nhảy/khiêu vũ', example: 'She likes to dance.' },
    { word: 'travel', type: 'verb', meaning: 'du lịch', example: 'I want to travel to Japan.' },
    { word: 'music', type: 'noun', meaning: 'âm nhạc', example: 'I listen to music every day.' },
    { word: 'movie', type: 'noun', meaning: 'phim', example: "Let's watch a movie tonight." },
    { word: 'game', type: 'noun', meaning: 'trò chơi', example: 'This game is fun.' },
    { word: 'sport', type: 'noun', meaning: 'thể thao', example: 'What sport do you like?' },
    { word: 'hobby', type: 'noun', meaning: 'sở thích', example: 'Reading is my hobby.' },
    { word: 'painting', type: 'noun', meaning: 'vẽ tranh', example: 'Painting is relaxing.' },
    { word: 'run', type: 'verb', meaning: 'chạy', example: 'I run in the park every morning.' },
    { word: 'enjoy', type: 'verb', meaning: 'thích/tận hưởng', example: 'I enjoy learning English.' },
  ],
  animals: [
    { word: 'dog', type: 'noun', meaning: 'chó', example: 'I have a pet dog.' },
    { word: 'cat', type: 'noun', meaning: 'mèo', example: 'The cat is sleeping.' },
    { word: 'bird', type: 'noun', meaning: 'chim', example: 'The bird can fly.' },
    { word: 'elephant', type: 'noun', meaning: 'voi', example: 'Elephants are very big.' },
    { word: 'monkey', type: 'noun', meaning: 'khỉ', example: 'Monkeys like bananas.' },
    { word: 'rabbit', type: 'noun', meaning: 'thỏ', example: 'The rabbit is cute.' },
    { word: 'tiger', type: 'noun', meaning: 'hổ', example: 'Tigers are strong animals.' },
    { word: 'bear', type: 'noun', meaning: 'gấu', example: 'Bears live in the forest.' },
    { word: 'cow', type: 'noun', meaning: 'bò', example: 'The cow gives us milk.' },
    { word: 'chicken', type: 'noun', meaning: 'gà', example: 'We have many chickens.' },
    { word: 'horse', type: 'noun', meaning: 'ngựa', example: 'The horse runs fast.' },
    { word: 'pet', type: 'noun', meaning: 'thú cưng', example: 'Do you have a pet?' },
    { word: 'wild', type: 'adj', meaning: 'hoang dã', example: 'Wild animals live in the forest.' },
    { word: 'cute', type: 'adj', meaning: 'dễ thương', example: 'The puppy is so cute.' },
    { word: 'feed', type: 'verb', meaning: 'cho ăn', example: 'I feed my dog every morning.' },
  ],
  daily_life: [
    { word: 'wake up', type: 'phrase', meaning: 'thức dậy', example: 'I wake up at 6 AM.' },
    { word: 'breakfast', type: 'noun', meaning: 'bữa sáng', example: 'I eat breakfast at 7 AM.' },
    { word: 'lunch', type: 'noun', meaning: 'bữa trưa', example: 'We have lunch at school.' },
    { word: 'dinner', type: 'noun', meaning: 'bữa tối', example: 'My family eats dinner together.' },
    { word: 'go to school', type: 'phrase', meaning: 'đi học', example: 'I go to school by bike.' },
    { word: 'go home', type: 'phrase', meaning: 'về nhà', example: 'I go home at 5 PM.' },
    { word: 'sleep', type: 'verb', meaning: 'ngủ', example: 'I sleep at 10 PM.' },
    { word: 'shower', type: 'noun', meaning: 'tắm', example: 'I take a shower every morning.' },
    { word: 'brush teeth', type: 'phrase', meaning: 'đánh răng', example: 'I brush my teeth twice a day.' },
    { word: 'clean', type: 'verb', meaning: 'dọn dẹp', example: 'I clean my room on Sunday.' },
    { word: 'watch TV', type: 'phrase', meaning: 'xem TV', example: 'I watch TV after dinner.' },
    { word: 'morning', type: 'noun', meaning: 'buổi sáng', example: 'Good morning, teacher!' },
    { word: 'afternoon', type: 'noun', meaning: 'buổi chiều', example: 'I play in the afternoon.' },
    { word: 'evening', type: 'noun', meaning: 'buổi tối', example: 'I study in the evening.' },
    { word: 'weekend', type: 'noun', meaning: 'cuối tuần', example: 'I rest on the weekend.' },
  ],
};

function generate() {
  const args = process.argv.slice(2);
  const topicIdx = args.indexOf('--topic');
  const all = args.includes('--all');
  
  const outputDir = path.resolve(__dirname, '../output/seed-data');
  fs.mkdirSync(outputDir, { recursive: true });

  if (all) {
    let allVocab = [];
    let id = 1;
    for (const [topic, words] of Object.entries(VOCAB_DATA)) {
      words.forEach(w => {
        allVocab.push({ id: id++, ...w, topic, difficulty: 'easy' });
      });
    }
    fs.writeFileSync(path.join(outputDir, 'vocabulary-all.json'), JSON.stringify(allVocab, null, 2));
    console.log(`✅ Generated ${allVocab.length} vocabulary items → vocabulary-all.json`);
    console.log(`\n📊 By topic:`);
    for (const [topic, words] of Object.entries(VOCAB_DATA)) {
      console.log(`  ${topic}: ${words.length} words`);
    }
  } else if (topicIdx !== -1) {
    const topic = args[topicIdx + 1];
    const data = VOCAB_DATA[topic];
    if (!data) {
      console.log(`❌ Unknown topic: ${topic}`);
      console.log(`Available: ${Object.keys(VOCAB_DATA).join(', ')}`);
      return;
    }
    fs.writeFileSync(path.join(outputDir, `vocabulary-${topic}.json`), JSON.stringify(data, null, 2));
    console.log(`✅ Generated ${data.length} words for topic: ${topic}`);
  } else {
    console.log('Usage:');
    console.log('  node vocab-generator.js --all');
    console.log('  node vocab-generator.js --topic <topic>');
    console.log(`\nTopics: ${Object.keys(VOCAB_DATA).join(', ')}`);
  }
}

generate();
