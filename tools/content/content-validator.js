#!/usr/bin/env node
/**
 * ✅ Content Validator
 * Kiểm tra chất lượng nội dung từ vựng và bài đọc
 *
 * Usage: node content-validator.js <json-file>
 */

const fs = require('fs');
const path = require('path');

const RULES = {
  vocabulary: [
    { field: 'word', check: v => v && v.length > 0, msg: 'Word is empty' },
    { field: 'word', check: v => v && v.length <= 50, msg: 'Word too long (max 50 chars)' },
    { field: 'meaning', check: v => v && v.length > 0, msg: 'Meaning is empty' },
    { field: 'word_type', check: v => ['noun','verb','adj','adv','prep','conj','phrase'].includes(v), msg: 'Invalid word type' },
    { field: 'example', check: v => v && v.length >= 5, msg: 'Example too short (min 5 chars)' },
    { field: 'example', check: v => v && v.endsWith('.'), msg: 'Example should end with period' },
  ],
  reading: [
    { field: 'title', check: v => v && v.length > 0, msg: 'Title is empty' },
    { field: 'content', check: v => v && v.split(' ').length >= 30, msg: 'Content too short (min 30 words)' },
    { field: 'content', check: v => v && v.split(' ').length <= 300, msg: 'Content too long (max 300 words)' },
    { field: 'questions', check: v => Array.isArray(v) && v.length >= 4, msg: 'Need at least 4 questions' },
    { field: 'questions', check: v => Array.isArray(v) && v.length <= 6, msg: 'Max 6 questions' },
  ],
};

function validate() {
  const file = process.argv[2];
  if (!file) {
    console.log('Usage: node content-validator.js <json-file>');
    return;
  }

  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const items = Array.isArray(data) ? data : [data];
  
  console.log(`✅ Content Validator\n`);
  console.log(`📁 File: ${file}`);
  console.log(`📊 Items: ${items.length}\n`);

  // Detect type
  const isVocab = items[0]?.word !== undefined;
  const rules = isVocab ? RULES.vocabulary : RULES.reading;
  let totalIssues = 0;

  items.forEach((item, idx) => {
    const issues = [];
    for (const rule of rules) {
      const value = item[rule.field] || item[rule.field.replace('meaning', 'meaning_vi')] || item[rule.field.replace('example', 'example_sentence')];
      if (!rule.check(value)) {
        issues.push(rule.msg);
      }
    }
    if (issues.length > 0) {
      console.log(`  ⚠️  Item ${idx + 1} (${item.word || item.title || 'unknown'}):`); 
      issues.forEach(i => console.log(`     - ${i}`));
      totalIssues += issues.length;
    }
  });

  console.log(`\n${'─'.repeat(40)}`);
  if (totalIssues === 0) console.log('✅ All content is valid!');
  else console.log(`⚠️  Found ${totalIssues} issues to fix.`);
}

validate();
