#!/usr/bin/env node
/**
 * 🎨 Content & Visual Asset Validator (Fine Arts Edition)
 * Kiểm tra chất lượng dữ liệu thuật ngữ Mỹ thuật & tính toàn vẹn của hình ảnh minh họa
 *
 * Usage:
 *   node content/content-validator.js
 *   node content/content-validator.js --file <custom-json-file>
 */

const fs = require('fs');
const path = require('path');

const VALID_PARTS_OF_SPEECH = ['noun', 'verb', 'adjective', 'adverb', 'phrase', 'preposition', 'conjunction'];
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

const VOCAB_RULES = [
  { field: 'word', check: (v) => v && typeof v === 'string' && v.trim().length > 0, msg: 'Thuật ngữ (word) không được để trống' },
  { field: 'meaning_vi', check: (v) => v && typeof v === 'string' && v.trim().length > 0, msg: 'Nghĩa tiếng Việt (meaning_vi) không được để trống' },
  { field: 'pronunciation', check: (v) => v && typeof v === 'string' && v.startsWith('/') && v.endsWith('/'), msg: 'Phiên âm IPA phải bắt đầu và kết thúc bằng dấu gạch chéo (/.../)' },
  { field: 'part_of_speech', check: (v) => VALID_PARTS_OF_SPEECH.includes(v), msg: `Từ loại không hợp lệ (phải thuộc [${VALID_PARTS_OF_SPEECH.join(', ')}])` },
  { field: 'difficulty', check: (v) => VALID_DIFFICULTIES.includes(v), msg: `Độ khó không hợp lệ (phải thuộc [${VALID_DIFFICULTIES.join(', ')}])` },
  { field: 'example_sentence', check: (v) => v && typeof v === 'string' && v.length >= 10, msg: 'Câu ví dụ tiếng Anh quá ngắn (tối thiểu 10 ký tự)' },
  { field: 'example_sentence', check: (v) => v && typeof v === 'string' && /[.!?]$/.test(v.trim()), msg: 'Câu ví dụ tiếng Anh phải kết thúc bằng dấu chấm câu (. ! ?)' },
  { field: 'example_translation', check: (v) => v && typeof v === 'string' && v.length >= 5, msg: 'Bản dịch ví dụ tiếng Việt không được để trống' },
  { field: 'cultural_note', check: (v) => v && typeof v === 'string' && v.length >= 20, msg: 'Bối cảnh văn hóa & lịch sử nghệ thuật (cultural_note) phải từ 20 ký tự trở lên' },
  { field: 'related_artist', check: (v) => v && typeof v === 'string' && v.length >= 3, msg: 'Nghệ sĩ / làng nghề tiêu biểu (related_artist) không được để trống' },
  { field: 'source_ref', check: (v) => v && typeof v === 'string' && v.length >= 3, msg: 'Nguồn từ điển tham chiếu (source_ref) không được để trống' },
  { field: 'image_url', check: (v) => v && typeof v === 'string' && /\.(svg|jpg|jpeg|png|webp)$/i.test(v), msg: 'Đường dẫn ảnh phải có định dạng hợp lệ (.jpg, .jpeg, .png, .webp hoặc .svg)' }
];

function validate() {
  console.log('\n================================================================');
  console.log('🎨 ENGLEARN v2.0 - DATA & VISUAL ASSET INTEGRITY VALIDATOR');
  console.log('================================================================\n');

  const clientPublicDir = path.resolve(__dirname, '../../client/public');
  const fallbackSvgPath = path.join(clientPublicDir, 'images/vocab/_placeholder.svg');

  // 1. Kiểm tra ảnh fallback dự phòng
  console.log('🖼️  [BƯỚC 1] Kiểm tra file ảnh dự phòng chuẩn nghệ thuật (_placeholder.svg):');
  if (fs.existsSync(fallbackSvgPath)) {
    const stats = fs.statSync(fallbackSvgPath);
    console.log(`   ✅ Tồn tại: ${path.relative(clientPublicDir, fallbackSvgPath)} (${stats.size} bytes)`);
  } else {
    console.error(`   ❌ THIẾU FILE DỰ PHÒNG: Không tìm thấy ${fallbackSvgPath}`);
  }

  // 2. Tải nguồn dữ liệu
  let topics = [];
  let vocabList = [];

  const customFileArg = process.argv.indexOf('--file');
  if (customFileArg !== -1 && process.argv[customFileArg + 1]) {
    const filePath = path.resolve(process.cwd(), process.argv[customFileArg + 1]);
    console.log(`\n📁 Đọc từ file JSON tùy chỉnh: ${filePath}`);
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    vocabList = Array.isArray(raw) ? raw : [raw];
  } else {
    // Mặc định load từ artVocabData.js
    const artVocabPath = path.resolve(__dirname, '../../server/src/seeders/artVocabData.js');
    console.log(`\n📚 [BƯỚC 2] Đọc dữ liệu từ: ${path.relative(process.cwd(), artVocabPath)}`);
    const { topicsData, vocabByTopic } = require(artVocabPath);
    topics = topicsData;

    for (const [topicId, words] of Object.entries(vocabByTopic)) {
      const topicObj = topics.find((t) => String(t.id) === String(topicId));
      words.forEach((w) => {
        vocabList.push({
          ...w,
          _topicName: topicObj ? `${topicObj.name_vi} (${topicObj.name})` : `Topic ${topicId}`
        });
      });
    }
  }

  console.log(`   📊 Tổng số chuyên đề: ${topics.length}`);
  console.log(`   📊 Tổng số thuật ngữ cần thẩm định: ${vocabList.length}\n`);

  // 3. Kiểm định từng thuật ngữ & file ảnh vật lý
  console.log('🔍 [BƯỚC 3] Thẩm định từng thuật ngữ, bối cảnh văn hóa & file ảnh minh họa trên đĩa:');

  let totalIssues = 0;
  let missingSvgCount = 0;
  let validSvgCount = 0;

  vocabList.forEach((item, idx) => {
    const issues = [];

    // Kiểm tra quy tắc trường dữ liệu
    for (const rule of VOCAB_RULES) {
      if (!rule.check(item[rule.field])) {
        issues.push(rule.msg);
      }
    }

    // Kiểm tra file ảnh có thực sự nằm trong client/public không
    if (item.image_url) {
      const relativeClean = item.image_url.startsWith('/') ? item.image_url.slice(1) : item.image_url;
      const physicalImgPath = path.join(clientPublicDir, relativeClean);

      if (!fs.existsSync(physicalImgPath)) {
        issues.push(`File ảnh không tồn tại trên đĩa: client/public/${relativeClean}`);
        missingSvgCount++;
      } else if (relativeClean.toLowerCase().endsWith('.svg')) {
        const svgContent = fs.readFileSync(physicalImgPath, 'utf-8');
        if (!svgContent.includes('<svg') || !svgContent.includes('</svg>')) {
          issues.push(`File SVG bị lỗi cấu trúc xml/svg: client/public/${relativeClean}`);
        } else {
          validSvgCount++;
        }
      } else {
        const buf = fs.readFileSync(physicalImgPath);
        const isJpg = buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8;
        const isPng = buf.length > 4 && buf[0] === 0x89 && buf[1] === 0x50;
        const isWebp = buf.length > 4 && buf.slice(0, 4).toString('ascii') === 'RIFF';
        if (!isJpg && !isPng && !isWebp) {
          issues.push(`File ảnh bị hỏng hoặc sai định dạng nhị phân: client/public/${relativeClean}`);
        } else {
          validSvgCount++;
        }
      }
    }

    if (issues.length > 0) {
      console.log(`\n  ⚠️  [LỖI] Thuật ngữ #${idx + 1}: "${item.word}" [${item._topicName || 'N/A'}]`);
      issues.forEach((issue) => console.log(`     - ${issue}`));
      totalIssues += issues.length;
    }
  });

  // 4. Báo cáo tổng kết
  console.log('\n----------------------------------------------------------------');
  console.log('📊 TỔNG KẾT KIỂM ĐỊNH NỘI DUNG & TÀI NGUYÊN MỸ THUẬT');
  console.log('----------------------------------------------------------------');
  console.log(`  • Tổng số thuật ngữ:           ${vocabList.length} từ`);
  console.log(`  • File ảnh minh họa hợp lệ:    ${validSvgCount} / ${vocabList.length} (${Math.round((validSvgCount / (vocabList.length || 1)) * 100)}%)`);
  console.log(`  • File ảnh thiếu:              ${missingSvgCount}`);
  console.log(`  • Tổng số lỗi phát hiện:       ${totalIssues}`);

  if (totalIssues === 0) {
    console.log('\n🎉 HOÀN HẢO: 100% Thuật ngữ Mỹ thuật, bối cảnh văn hóa & file ảnh minh họa đạt chuẩn tuyệt đối!\n');
    process.exit(0);
  } else {
    console.log(`\n⚠️  Cảnh báo: Có ${totalIssues} vấn đề cần kiểm tra.\n`);
    process.exit(1);
  }
}

validate();
