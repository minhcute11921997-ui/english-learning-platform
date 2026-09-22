#!/usr/bin/env node
/**
 * 📖 Reading Passage Template Generator
 * Tạo template bài đọc mẫu theo chủ đề
 *
 * Usage:
 *   node reading-generator.js --topic family --difficulty easy
 *   node reading-generator.js --all
 */

const fs = require('fs');
const path = require('path');

const READINGS = {
  about_me: [
    {
      title: 'My Name is Lan',
      difficulty: 'easy',
      content: `My name is Lan. I am 14 years old. I am a student at Le Loi Secondary School. I am tall and thin. I have long black hair and brown eyes. I am friendly and kind. I like to help my friends. My favorite color is blue. I live in Ho Chi Minh City with my family. I love my school and my friends.`,
      content_vi: 'Tên tôi là Lan. Tôi 14 tuổi. Tôi là học sinh trường THCS Lê Lợi. Tôi cao và gầy. Tôi có mái tóc đen dài và đôi mắt nâu. Tôi thân thiện và tốt bụng. Tôi thích giúp đỡ bạn bè. Màu yêu thích của tôi là xanh dương. Tôi sống ở Thành phố Hồ Chí Minh cùng gia đình. Tôi yêu trường học và bạn bè.',
      questions: [
        { question: 'How old is Lan?', options: ['13', '14', '15', '16'], correct: 'B', explanation: 'Bài viết nói "I am 14 years old" - Tôi 14 tuổi.' },
        { question: 'What does Lan look like?', options: ['Short and fat', 'Tall and thin', 'Short and thin', 'Tall and fat'], correct: 'B', explanation: 'Bài viết nói "I am tall and thin" - Tôi cao và gầy.' },
        { question: "What is Lan's favorite color?", options: ['Red', 'Green', 'Blue', 'Yellow'], correct: 'C', explanation: 'Bài viết nói "My favorite color is blue" - Màu yêu thích là xanh dương.' },
        { question: 'Where does Lan live?', options: ['Ha Noi', 'Da Nang', 'Ho Chi Minh City', 'Hue'], correct: 'C', explanation: 'Bài viết nói "I live in Ho Chi Minh City" - Tôi sống ở TP.HCM.' },
      ]
    },
  ],
  family: [
    {
      title: 'My Big Family',
      difficulty: 'easy',
      content: `I have a big family. There are six people in my family: my grandfather, my grandmother, my father, my mother, my sister and me. My father is a doctor. He works at a hospital. My mother is a teacher. She teaches English. My sister is 10 years old. She is in grade 5. My grandparents live with us. They are old but very healthy. I love my family very much.`,
      content_vi: 'Tôi có một gia đình lớn. Gia đình tôi có sáu người: ông, bà, bố, mẹ, chị gái và tôi. Bố tôi là bác sĩ. Ông ấy làm việc ở bệnh viện. Mẹ tôi là giáo viên. Bà ấy dạy tiếng Anh. Chị gái tôi 10 tuổi. Chị ấy học lớp 5. Ông bà sống cùng chúng tôi. Họ già nhưng rất khỏe mạnh. Tôi rất yêu gia đình mình.',
      questions: [
        { question: 'How many people are in the family?', options: ['4', '5', '6', '7'], correct: 'C', explanation: 'Bài viết nói "There are six people" - Có sáu người.' },
        { question: 'What does the father do?', options: ['Teacher', 'Doctor', 'Engineer', 'Driver'], correct: 'B', explanation: 'Bài viết nói "My father is a doctor" - Bố tôi là bác sĩ.' },
        { question: 'What does the mother teach?', options: ['Math', 'Vietnamese', 'English', 'Science'], correct: 'C', explanation: 'Bài viết nói "She teaches English" - Bà ấy dạy tiếng Anh.' },
        { question: 'How old is the sister?', options: ['8', '9', '10', '11'], correct: 'C', explanation: 'Bài viết nói "My sister is 10 years old" - Chị gái 10 tuổi.' },
      ]
    },
  ],
};

function generate() {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const topicIdx = args.indexOf('--topic');

  const outputDir = path.resolve(__dirname, '../output/seed-data');
  fs.mkdirSync(outputDir, { recursive: true });

  if (all) {
    let allReadings = [];
    let id = 1;
    for (const [topic, readings] of Object.entries(READINGS)) {
      readings.forEach(r => {
        allReadings.push({ id: id++, ...r, topic });
      });
    }
    fs.writeFileSync(path.join(outputDir, 'readings-all.json'), JSON.stringify(allReadings, null, 2));
    console.log(`✅ Generated ${allReadings.length} reading passages`);
  } else if (topicIdx !== -1) {
    const topic = args[topicIdx + 1];
    const data = READINGS[topic];
    if (!data) {
      console.log(`❌ Unknown topic. Available: ${Object.keys(READINGS).join(', ')}`);
      return;
    }
    fs.writeFileSync(path.join(outputDir, `readings-${topic}.json`), JSON.stringify(data, null, 2));
    console.log(`✅ Generated ${data.length} readings for: ${topic}`);
  } else {
    console.log('Usage: node reading-generator.js --all | --topic <name>');
    console.log(`Topics: ${Object.keys(READINGS).join(', ')}`);
  }
}

generate();
