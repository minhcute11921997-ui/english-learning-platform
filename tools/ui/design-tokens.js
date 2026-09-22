#!/usr/bin/env node
/**
 * 🎯 Design Tokens Generator
 * Tạo hệ thống design tokens cho dự án
 *
 * Usage: node design-tokens.js
 */

const fs = require('fs');
const path = require('path');

const tokens = {
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    card: '0 2px 8px rgba(0, 0, 0, 0.08)',
    flashcard: '0 4px 12px rgba(0, 0, 0, 0.12)',
  },
  animation: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    flashcardFlip: '600ms',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
};

// Generate CSS custom properties
let css = '/* Auto-generated Design Tokens */\n:root {\n';
for (const [group, values] of Object.entries(tokens)) {
  css += `  /* ${group} */\n`;
  for (const [key, value] of Object.entries(values)) {
    const val = typeof value === 'object' ? (Array.isArray(value) ? value[0] : JSON.stringify(value)) : value;
    css += `  --${group}-${key}: ${val};\n`;
  }
  css += '\n';
}
css += '}\n';

// Generate JS constants
const js = `// Auto-generated Design Tokens\nexport const designTokens = ${JSON.stringify(tokens, null, 2)};\n`;

const outputDir = path.resolve(__dirname, '../output');
fs.mkdirSync(outputDir, { recursive: true });

fs.writeFileSync(path.join(outputDir, 'design-tokens.css'), css);
fs.writeFileSync(path.join(outputDir, 'design-tokens.js'), js);

console.log('🎯 Design Tokens Generated:\n');
console.log(`📁 ${path.join(outputDir, 'design-tokens.css')}`);
console.log(`📁 ${path.join(outputDir, 'design-tokens.js')}`);
console.log(`\n📋 Token groups: ${Object.keys(tokens).join(', ')}`);
