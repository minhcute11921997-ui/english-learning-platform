#!/usr/bin/env node
/**
 * 🔍 Environment Variable Checker
 * Kiểm tra các biến môi trường cần thiết cho dự án
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_VARS = {
  server: {
    file: path.resolve(__dirname, '../../server/.env'),
    vars: [
      { name: 'DB_HOST', desc: 'MySQL host', default: 'localhost' },
      { name: 'DB_PORT', desc: 'MySQL port', default: '3306' },
      { name: 'DB_USER', desc: 'MySQL username' },
      { name: 'DB_PASSWORD', desc: 'MySQL password' },
      { name: 'DB_NAME', desc: 'Database name', default: 'english_learning' },
      { name: 'JWT_SECRET', desc: 'JWT signing secret' },
      { name: 'JWT_REFRESH_SECRET', desc: 'JWT refresh token secret' },
      { name: 'PORT', desc: 'Server port', default: '3000' },
      { name: 'CLOUDINARY_CLOUD_NAME', desc: 'Cloudinary cloud name', optional: true },
      { name: 'CLOUDINARY_API_KEY', desc: 'Cloudinary API key', optional: true },
      { name: 'CLOUDINARY_API_SECRET', desc: 'Cloudinary API secret', optional: true },
    ],
  },
};

function checkEnv() {
  console.log('🔍 Environment Variable Checker\n');
  let allGood = true;

  for (const [section, config] of Object.entries(REQUIRED_VARS)) {
    console.log(`📋 ${section.toUpperCase()} (${config.file}):`);

    let envContent = {};
    if (fs.existsSync(config.file)) {
      const content = fs.readFileSync(config.file, 'utf-8');
      content.split('\n').forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) envContent[match[1].trim()] = match[2].trim();
      });
    } else {
      console.log(`  ⚠️  File not found: ${config.file}`);
      console.log(`  💡 Creating .env.example...\n`);
      const example = config.vars.map(v => `${v.name}=${v.default || ''}`).join('\n');
      const examplePath = config.file.replace('.env', '.env.example');
      const dir = path.dirname(examplePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(examplePath, example);
      allGood = false;
      continue;
    }

    for (const v of config.vars) {
      const value = envContent[v.name];
      if (value) {
        const masked = v.name.includes('SECRET') || v.name.includes('PASSWORD') || v.name.includes('KEY')
          ? value.slice(0, 3) + '***' : value;
        console.log(`  ✅ ${v.name} = ${masked}`);
      } else if (v.optional) {
        console.log(`  ⚪ ${v.name} (optional - ${v.desc})`);
      } else if (v.default) {
        console.log(`  ⚠️  ${v.name} not set, default: ${v.default}`);
      } else {
        console.log(`  ❌ ${v.name} - MISSING (${v.desc})`);
        allGood = false;
      }
    }
    console.log();
  }

  console.log(allGood ? '🎉 All required variables are set!' : '⚠️  Some variables are missing.');
}

checkEnv();
