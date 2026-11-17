#!/usr/bin/env node
/**
 * ♿ Accessibility Checker
 * Kiểm tra các vấn đề accessibility phổ biến trong source code React (hỗ trợ thẻ JSX nhiều dòng)
 *
 * Usage: node a11y-check.js [directory]
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const INTERACTIVE_TAGS = new Set([
  'button',
  'Button',
  'a',
  'Link',
  'NavLink',
  'input',
  'select',
  'textarea',
  'summary'
]);

/**
 * Tách các thẻ mở JSX nhiều dòng (bỏ qua ký tự '>' nằm trong biểu thức JS {...} hoặc chuỗi)
 */
function extractOpeningTags(content) {
  const tags = [];
  let line = 1;
  const len = content.length;

  for (let i = 0; i < len; i++) {
    const ch = content[i];
    if (ch === '\n') {
      line++;
      continue;
    }

    if (ch === '<' && i + 1 < len && /[A-Za-z]/.test(content[i + 1])) {
      // Đảm bảo không phải generic TypeScript hay so sánh a < b
      const prev = i > 0 ? content[i - 1] : '';
      if (/[A-Za-z0-9_$\])]/.test(prev)) continue;

      const startLine = line;
      let j = i + 1;
      while (j < len && /[A-Za-z0-9_.]/.test(content[j])) j++;
      const tagName = content.slice(i + 1, j);

      // Chỉ phân tích thẻ nếu theo sau tên thẻ là khoảng trắng, '/' hoặc '>'
      if (j < len && !/[\s/>]/.test(content[j])) continue;

      let braceDepth = 0;
      let quote = null;
      let k = j;
      let innerLines = 0;

      while (k < len) {
        const c = content[k];
        if (c === '\n') innerLines++;

        if (quote) {
          if (c === '\\') {
            k += 2;
            continue;
          }
          if (c === quote) quote = null;
        } else {
          if (c === '"' || c === "'" || c === '`') {
            quote = c;
          } else if (c === '{') {
            braceDepth++;
          } else if (c === '}') {
            if (braceDepth > 0) braceDepth--;
          } else if (c === '>' && braceDepth === 0) {
            break;
          }
        }
        k++;
      }

      if (k < len && content[k] === '>') {
        const attrsText = content.slice(j, k);
        tags.push({ tagName, attrsText, line: startLine, endOffset: k + 1 });
        line += innerLines;
        i = k;
      }
    }
  }

  return tags;
}

async function check() {
  const targetDir = process.argv[2] || path.resolve(__dirname, '../../client/src');
  console.log(`♿ Accessibility Checker\n`);
  console.log(`📁 Scanning: ${targetDir}\n`);

  const files = await glob(`${targetDir}/**/*.{jsx,tsx}`, { ignore: ['**/node_modules/**'] });
  const counts = { error: 0, warn: 0, info: 0 };

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const tags = extractOpeningTags(content);
    const issues = [];

    for (const { tagName, attrsText, line, endOffset } of tags) {
      if (tagName === 'img' && !/\balt\s*=/.test(attrsText)) {
        issues.push({ line, desc: 'img without alt attribute', severity: 'error' });
      }

      if (tagName === 'a' && !/\baria-label\s*=/.test(attrsText)) {
        const tail = content.slice(endOffset, endOffset + 300);
        const closeMatch = tail.match(/^([\s\S]*?)<\/a>/);
        if (closeMatch && !closeMatch[1].trim()) {
          issues.push({ line, desc: 'Link might be missing accessible text', severity: 'warn' });
        }
      }

      if (/\bonClick\s*=/.test(attrsText) && !INTERACTIVE_TAGS.has(tagName)) {
        const hasRole = /\brole\s*=/.test(attrsText);
        const isBackdropOrStopProp =
          attrsText.includes('stopPropagation') || attrsText.includes('fixed inset-0');
        if (!hasRole && !isBackdropOrStopProp) {
          issues.push({ line, desc: 'onClick without role or button element', severity: 'warn' });
        }
      }

      if (
        tagName === 'input' &&
        !/\b(aria-label|aria-labelledby|id|placeholder)\s*=/.test(attrsText)
      ) {
        issues.push({ line, desc: 'Input without label association', severity: 'warn' });
      }

      if (/\btabIndex\s*=\s*["']?-1["']?/.test(attrsText) || /\btabIndex\s*=\s*{\s*-1\s*}/.test(attrsText)) {
        issues.push({ line, desc: 'Negative tabIndex removes from tab order', severity: 'info' });
      }

      if (/\bautoFocus\b/.test(attrsText)) {
        issues.push({ line, desc: 'autoFocus can be disorienting for screen readers', severity: 'info' });
      }
    }

    if (issues.length > 0) {
      const relative = path.relative(targetDir, file);
      console.log(`📄 ${relative}:`);
      const icons = { error: '❌', warn: '⚠️', info: 'ℹ️' };
      issues.forEach((i) => {
        console.log(`  ${icons[i.severity]} Line ${i.line}: ${i.desc}`);
        counts[i.severity]++;
      });
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📊 ${files.length} files scanned`);
  console.log(`   ❌ ${counts.error} errors | ⚠️ ${counts.warn} warnings | ℹ️ ${counts.info} info`);
  if (counts.error === 0 && counts.warn === 0) console.log('\n✅ Great accessibility practices!');
}

check();
