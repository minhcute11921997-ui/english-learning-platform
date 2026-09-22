#!/usr/bin/env node
/**
 * 📚 API Documentation Generator
 * Tạo tài liệu API tự động từ route files
 *
 * Usage: node api-doc-generator.js [routes-directory]
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

async function generate() {
  const routesDir = process.argv[2] || path.resolve(__dirname, '../../server/src/routes');
  console.log(`📚 API Documentation Generator\n`);
  console.log(`📁 Routes: ${routesDir}\n`);

  const files = await glob(`${routesDir}/**/*.{js,ts}`);
  let markdown = '# 📘 API Documentation\n\n';
  markdown += `> Auto-generated on ${new Date().toLocaleDateString()}\n\n`;
  markdown += '---\n\n';

  for (const file of files.sort()) {
    const content = fs.readFileSync(file, 'utf-8');
    const basename = path.basename(file, path.extname(file)).replace('.routes', '');
    
    markdown += `## ${basename.charAt(0).toUpperCase() + basename.slice(1)}\n\n`;
    markdown += `| Method | Path | Auth | Description |\n`;
    markdown += `|--------|------|------|-------------|\n`;

    // Parse route definitions
    const routePattern = /router\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/gi;
    let match;
    while ((match = routePattern.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const routePath = match[2];
      const hasAuth = content.includes('auth') ? '🔒' : '🔓';
      markdown += `| \`${method}\` | \`/api/${basename}${routePath}\` | ${hasAuth} | |\n`;
    }
    markdown += '\n';
  }

  const outputDir = path.resolve(__dirname, '../output');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputFile = path.join(outputDir, 'api-documentation.md');
  fs.writeFileSync(outputFile, markdown);

  console.log(`✅ Documentation generated: ${outputFile}`);
  console.log(`📊 Processed ${files.length} route files`);
}

generate();
