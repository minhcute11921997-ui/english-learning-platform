#!/usr/bin/env node
/**
 * 🔑 JWT Configuration Validator
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../server/.env') });

console.log('🔑 JWT Security Validator\n');

const checks = [
  {
    name: 'JWT_SECRET length',
    check: () => {
      const secret = process.env.JWT_SECRET;
      if (!secret) return { status: 'fail', msg: 'JWT_SECRET not set' };
      if (secret.length < 32) return { status: 'warn', msg: `Too short (${secret.length} chars, recommended ≥32)` };
      return { status: 'pass', msg: `${secret.length} characters ✓` };
    }
  },
  {
    name: 'JWT_SECRET is not default',
    check: () => {
      const defaults = ['secret', 'jwt_secret', 'your-secret-key', 'changeme', '123456'];
      const secret = process.env.JWT_SECRET || '';
      if (defaults.includes(secret.toLowerCase())) return { status: 'fail', msg: 'Using default/weak secret!' };
      return { status: 'pass', msg: 'Non-default secret ✓' };
    }
  },
  {
    name: 'JWT_REFRESH_SECRET differs from JWT_SECRET',
    check: () => {
      if (!process.env.JWT_REFRESH_SECRET) return { status: 'warn', msg: 'JWT_REFRESH_SECRET not set' };
      if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) return { status: 'fail', msg: 'Same as JWT_SECRET!' };
      return { status: 'pass', msg: 'Different from JWT_SECRET ✓' };
    }
  },
  {
    name: 'Auth middleware exists',
    check: () => {
      const p1 = path.resolve(__dirname, '../../server/src/middleware/auth.js');
      const p2 = path.resolve(__dirname, '../../server/src/middlewares/auth.middleware.js');
      const p = fs.existsSync(p1) ? p1 : (fs.existsSync(p2) ? p2 : null);
      if (p) {
        const content = fs.readFileSync(p, 'utf-8');
        if (content.includes('verify')) return { status: 'pass', msg: 'Auth middleware with verify found ✓' };
        return { status: 'warn', msg: 'Auth middleware exists but may not verify tokens' };
      }
      return { status: 'warn', msg: 'Auth middleware not found yet' };
    }
  },
];

const icons = { pass: '✅', warn: '⚠️', fail: '❌' };
for (const check of checks) {
  const result = check.check();
  console.log(`  ${icons[result.status]} ${check.name}: ${result.msg}`);
}

console.log('\n💡 Generate strong secret: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
