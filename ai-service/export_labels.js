/**
 * Export 60 fine-arts & crafts vocabulary items from artVocabData.js to labels.json
 * so ai-service stays in sync with the database seeder.
 */
const fs = require('fs');
const path = require('path');
const { topicsData, vocabByTopic } = require('../server/src/seeders/artVocabData');

const topicMap = Object.fromEntries(topicsData.map((t) => [String(t.id), t]));
const labels = [];

for (const [topicId, items] of Object.entries(vocabByTopic)) {
  const topic = topicMap[topicId];
  for (const item of items) {
    labels.push({
      word: item.word,
      topic_id: Number(topicId),
      topic_name: topic?.name || '',
      meaning_vi: item.meaning_vi,
      image_url: item.image_url,
      image_alt: item.image_alt || '',
      cultural_note: item.cultural_note || ''
    });
  }
}

const outPath = path.join(__dirname, 'labels.json');
fs.writeFileSync(outPath, JSON.stringify({ model_default: 'google/siglip-so400m-patch14-384', labels }, null, 2), 'utf8');
console.log(`Exported ${labels.length} labels to ${outPath}`);
