#!/usr/bin/env node
/**
 * 🏗️ Seed Data Builder
 * Tổng hợp tất cả dữ liệu mẫu thành file seed hoàn chỉnh
 *
 * Usage: node seed-data-builder.js --all
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🏗️  Seed Data Builder\n');

const outputDir = path.resolve(__dirname, '../output/seed-data');
fs.mkdirSync(outputDir, { recursive: true });

// Step 1: Generate vocabulary
console.log('📝 Step 1: Generating vocabulary...');
try {
  execSync(`node ${path.resolve(__dirname, 'vocab-generator.js')} --all`, { stdio: 'inherit' });
} catch (e) { console.log('  ⚠️  Vocab generator had issues'); }

// Step 2: Generate readings
console.log('\n📖 Step 2: Generating reading passages...');
try {
  execSync(`node ${path.resolve(__dirname, 'reading-generator.js')} --all`, { stdio: 'inherit' });
} catch (e) { console.log('  ⚠️  Reading generator had issues'); }

// Step 3: Generate topics
console.log('\n📋 Step 3: Generating topics...');
const topics = [
  { id: 1, name: 'About Me', name_vi: 'Bản thân', icon_url: '🧑', display_order: 1 },
  { id: 2, name: 'Family', name_vi: 'Gia đình', icon_url: '👨👩👧👦', display_order: 2 },
  { id: 3, name: 'School', name_vi: 'Trường học', icon_url: '🏫', display_order: 3 },
  { id: 4, name: 'Food & Drink', name_vi: 'Đồ ăn & Thức uống', icon_url: '🍔', display_order: 4 },
  { id: 5, name: 'Hobbies', name_vi: 'Sở thích', icon_url: '⚽', display_order: 5 },
  { id: 6, name: 'Animals', name_vi: 'Động vật', icon_url: '🐕', display_order: 6 },
  { id: 7, name: 'Daily Life', name_vi: 'Sinh hoạt hằng ngày', icon_url: '🏠', display_order: 7 },
];
fs.writeFileSync(path.join(outputDir, 'topics.json'), JSON.stringify(topics, null, 2));
console.log(`  ✅ Generated ${topics.length} topics`);

// Step 4: Generate test users
console.log('\n👤 Step 4: Generating test users...');
const users = [
  { id: 1, username: 'admin', email: 'admin@enlearn.com', role: 'admin', full_name: 'Admin User', password: 'Admin@123' },
  { id: 2, username: 'creator01', email: 'creator@enlearn.com', role: 'creator', full_name: 'Nguyen Creator', password: 'Creator@123' },
  { id: 3, username: 'teacher01', email: 'teacher@enlearn.com', role: 'group_owner', full_name: 'Tran Teacher', password: 'Teacher@123' },
  { id: 4, username: 'student01', email: 'student1@enlearn.com', role: 'learner', full_name: 'Le Student', password: 'Student@123' },
  { id: 5, username: 'student02', email: 'student2@enlearn.com', role: 'learner', full_name: 'Pham Student', password: 'Student@123' },
];
fs.writeFileSync(path.join(outputDir, 'users.json'), JSON.stringify(users, null, 2));
console.log(`  ✅ Generated ${users.length} test users`);

// Step 5: Generate placement test
console.log('\n📋 Step 5: Generating placement test...');
const placementQuestions = [
  { question: 'What is your ___?', options: ['name', 'names', 'naming', 'named'], correct: 'A', difficulty: 'easy', explanation: '"name" là danh từ, dùng với "your" → "What is your name?"' },
  { question: 'She ___ a student.', options: ['am', 'is', 'are', 'be'], correct: 'B', difficulty: 'easy', explanation: '"She" đi với "is" → "She is a student."' },
  { question: 'I ___ to school every day.', options: ['goes', 'going', 'go', 'went'], correct: 'C', difficulty: 'easy', explanation: '"I" đi với động từ nguyên mẫu → "I go to school."' },
];
fs.writeFileSync(path.join(outputDir, 'placement-questions.json'), JSON.stringify(placementQuestions, null, 2));
console.log(`  ✅ Generated ${placementQuestions.length} placement questions (expand to 30 for production)`);

console.log('\n' + '═'.repeat(50));
console.log('🎉 Seed data built successfully!');
console.log(`📁 Output: ${outputDir}`);
console.log('\nFiles generated:');
fs.readdirSync(outputDir).forEach(f => {
  const size = (fs.statSync(path.join(outputDir, f)).size / 1024).toFixed(1);
  console.log(`  📄 ${f} (${size}KB)`);
});
