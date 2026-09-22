#!/usr/bin/env node
/**
 * 📥 CSV Vocabulary Importer
 * Import từ vựng từ file CSV vào format JSON cho seed data
 *
 * CSV Format: word,word_type,meaning_vi,example_sentence,topic,difficulty
 *
 * Usage: node csv-importer.js <file.csv> [--output result.json]
 */

const fs = require('fs');
const path = require('path');

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  return lines.slice(1).map((line, idx) => {
    // Handle commas inside quotes
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
      current += char;
    }
    values.push(current.trim());

    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    obj.id = idx + 1;
    return obj;
  });
}

function main() {
  const csvFile = process.argv[2];
  if (!csvFile) {
    console.log('📥 CSV Vocabulary Importer\n');
    console.log('Usage: node csv-importer.js <file.csv>');
    console.log('\nCSV format (with header):');
    console.log('word,word_type,meaning_vi,example_sentence,topic,difficulty');
    console.log('\nExample:');
    console.log('mother,noun,mẹ,My mother cooks very well.,family,easy');
    
    // Create sample CSV
    const sampleDir = path.resolve(__dirname, '../output');
    fs.mkdirSync(sampleDir, { recursive: true });
    const sample = `word,word_type,meaning_vi,example_sentence,topic,difficulty\nmother,noun,mẹ,My mother cooks very well.,family,easy\nfather,noun,bố/cha,My father works at a bank.,family,easy\nstudent,noun,học sinh,I am a student.,school,easy`;
    fs.writeFileSync(path.join(sampleDir, 'sample-vocabulary.csv'), sample);
    console.log(`\n💡 Sample CSV created: ${path.join(sampleDir, 'sample-vocabulary.csv')}`);
    return;
  }

  const content = fs.readFileSync(csvFile, 'utf-8');
  const data = parseCSV(content);
  
  const outputIdx = process.argv.indexOf('--output');
  const outputFile = outputIdx !== -1 ? process.argv[outputIdx + 1] : csvFile.replace('.csv', '.json');
  
  fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
  console.log(`✅ Imported ${data.length} vocabulary items → ${outputFile}`);
}

main();
