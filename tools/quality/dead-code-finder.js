#!/usr/bin/env node
/**
 * 🗑️ Dead Code Finder
 * Tìm các file và export không được sử dụng
 *
 * Usage: node dead-code-finder.js [directory]
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

async function findDeadCode() {
  const targetDir = process.argv[2] || path.resolve(__dirname, '../../client/src');
  console.log(`🗑️  Dead Code Finder\n`);
  console.log(`📁 Scanning: ${targetDir}\n`);

  const files = await glob(`${targetDir}/**/*.{js,jsx,ts,tsx}`, { ignore: ['**/node_modules/**'] });
  
  // Collect all exports
  const exports = new Map(); // filename -> [export names]
  const imports = new Set(); // all imported names

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const relative = path.relative(targetDir, file);
    
    // Find named exports
    const exportMatches = content.matchAll(/export\s+(?:const|function|class|let|var)\s+(\w+)/g);
    for (const match of exportMatches) {
      if (!exports.has(relative)) exports.set(relative, []);
      exports.get(relative).push(match[1]);
    }

    // Find imports
    const importMatches = content.matchAll(/import\s+(?:{([^}]+)}|\s*(\w+))/g);
    for (const match of importMatches) {
      if (match[1]) {
        match[1].split(',').forEach(name => imports.add(name.trim().split(' as ')[0].trim()));
      }
      if (match[2]) imports.add(match[2]);
    }
  }

  // Find unused exports
  console.log('📋 Potentially unused exports:\n');
  let unusedCount = 0;
  for (const [file, fileExports] of exports) {
    const unused = fileExports.filter(e => !imports.has(e));
    if (unused.length > 0) {
      console.log(`  📄 ${file}:`);
      unused.forEach(e => console.log(`     ⚠️  ${e}`));
      unusedCount += unused.length;
    }
  }

  // Find files not imported anywhere
  console.log('\n📋 Files with no imports from other files:\n');
  const importedFiles = new Set();
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const importPaths = content.matchAll(/from\s+['"]([^'"]+)['"]/g);
    for (const match of importPaths) {
      importedFiles.add(path.basename(match[1]).replace(/\.[^.]+$/, ''));
    }
  }

  let orphanCount = 0;
  for (const file of files) {
    const basename = path.basename(file).replace(/\.[^.]+$/, '');
    const relative = path.relative(targetDir, file);
    if (!importedFiles.has(basename) && !['App', 'main', 'index', 'vite-env'].includes(basename)) {
      console.log(`  ⚠️  ${relative}`);
      orphanCount++;
    }
  }

  console.log(`\n${'─'.repeat(40)}`);
  console.log(`📊 ${unusedCount} potentially unused exports`);
  console.log(`📊 ${orphanCount} potentially orphaned files`);
  console.log('\n💡 Note: Some may be used dynamically or in tests. Verify before removing.');
}

findDeadCode();
