/**
 * Script 02: Export dữ liệu từ MySQL database của dự án
 * 
 * Chạy: node tools/training/scripts/02_export_db.js
 * 
 * Yêu cầu biến môi trường (hoặc file .env trong thư mục server/):
 *   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Thử load từ server/.env nếu không có biến môi trường
try {
  require('dotenv').config({ path: path.join(__dirname, '../../../server/.env') });
} catch {}

const OUTPUT_DIR = path.join(__dirname, '../data/db_export');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function exportVocabulary(conn) {
  console.log('📤 Export bảng Vocabulary...');

  const [rows] = await conn.execute(`
    SELECT 
      word,
      part_of_speech,
      meaning_vi,
      example_sentence,
      example_translation
    FROM vocabularies
    WHERE is_approved = 1
      AND word IS NOT NULL 
      AND meaning_vi IS NOT NULL
      AND LENGTH(word) > 1
      AND LENGTH(meaning_vi) > 1
    ORDER BY id
  `);

  const pairs = [];

  for (const row of rows) {
    // Cặp 1: từ vựng EN → VI
    pairs.push({
      en: row.word.trim(),
      vi: row.meaning_vi.trim(),
      type: 'word',
      pos: row.part_of_speech
    });

    // Cặp 2: nghĩa VI → từ EN (chiều ngược)
    pairs.push({
      vi: row.meaning_vi.trim(),
      en: row.word.trim(),
      type: 'word_reverse',
      pos: row.part_of_speech
    });

    // Cặp 3: câu ví dụ EN → VI (nếu có)
    if (row.example_sentence && row.example_translation) {
      pairs.push({
        en: row.example_sentence.trim(),
        vi: row.example_translation.trim(),
        type: 'sentence'
      });
    }
  }

  const outFile = path.join(OUTPUT_DIR, 'vocabulary_pairs.jsonl');
  const stream = fs.createWriteStream(outFile, { encoding: 'utf8' });
  for (const p of pairs) {
    stream.write(JSON.stringify(p) + '\n');
  }
  stream.end();

  console.log(`✅ Vocabulary: ${rows.length} từ → ${pairs.length} cặp câu → ${outFile}`);
  return pairs.length;
}

async function exportReadings(conn) {
  console.log('📤 Export bảng Readings...');

  // Thử export bài đọc nếu có cột tiếng Việt
  try {
    const [rows] = await conn.execute(`
      SELECT title, content 
      FROM readings 
      WHERE content IS NOT NULL AND LENGTH(content) > 50
      LIMIT 1000
    `);

    if (rows.length === 0) {
      console.log('ℹ️  Không có dữ liệu bài đọc song ngữ');
      return 0;
    }

    // Lưu để dùng tương lai (cần thêm cột vi sau)
    const outFile = path.join(OUTPUT_DIR, 'readings_en.jsonl');
    const stream = fs.createWriteStream(outFile, { encoding: 'utf8' });
    for (const r of rows) {
      stream.write(JSON.stringify({ en: r.title, content: r.content }) + '\n');
    }
    stream.end();

    console.log(`✅ Readings: ${rows.length} bài → ${outFile} (chỉ EN, cần VI sau)`);
    return 0;
  } catch (e) {
    console.log('ℹ️  Bỏ qua export readings:', e.message);
    return 0;
  }
}

async function main() {
  console.log('=' .repeat(60));
  console.log('BƯỚC 2: EXPORT DỮ LIỆU TỪ DATABASE');
  console.log('=' .repeat(60));

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || process.env.DB_DATABASE || 'english_learning',
    user: process.env.DB_USER || process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
  };

  console.log(`🔌 Kết nối: ${config.user}@${config.host}:${config.port}/${config.database}`);

  let conn;
  try {
    conn = await mysql.createConnection(config);
    console.log('✅ Kết nối database thành công\n');

    let total = 0;
    total += await exportVocabulary(conn);
    total += await exportReadings(conn);

    console.log(`\n📊 Tổng số cặp câu từ DB: ${total.toLocaleString()}`);
    console.log(`📂 Lưu tại: ${OUTPUT_DIR}`);
    console.log('\n✅ Hoàn thành! Chạy tiếp: python scripts/03_format_dataset.py');
  } catch (err) {
    console.error('❌ Lỗi kết nối database:', err.message);
    console.error('\nKiểm tra lại biến môi trường:');
    console.error('  DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS');
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

main();
