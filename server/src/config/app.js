require('dotenv').config();
const fs = require('fs');
const path = require('path');

function loadCalibratedThresholds() {
  const thresholdFile = path.resolve(__dirname, '../../../ai-service/thresholds.json');
  try {
    if (fs.existsSync(thresholdFile)) {
      return JSON.parse(fs.readFileSync(thresholdFile, 'utf8'));
    }
  } catch {
    // Fallback to defaults if file unreadable
  }
  return {};
}

const calibrated = loadCalibratedThresholds();
const { randomBytes } = require('crypto');
const production = process.env.NODE_ENV === 'production';
const publicSecret = value => !value || value.length < 32 || /default|englearn_jwt|englearn_jwt_refresh|your-.*secret|change-in-production/i.test(value);
if (production && (publicSecret(process.env.JWT_SECRET) || publicSecret(process.env.JWT_REFRESH_SECRET) || process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET)) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be distinct private secrets of at least 32 characters');
}

module.exports = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || randomBytes(48).toString('hex'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || randomBytes(48).toString('hex'),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024 // 5MB
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  security: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5,
    lockoutDurationMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES, 10) || 15,
    passwordResetTtlMinutes: parseInt(process.env.PASSWORD_RESET_TTL_MINUTES, 10) || 15,
    emailVerifyTtlHours: parseInt(process.env.EMAIL_VERIFY_TTL_HOURS, 10) || 24
  },
  cookie: {
    httpOnly: true,
    secure: production,
    sameSite: 'lax',
    maxAgeMs: 30 * 24 * 60 * 60 * 1000
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'EngLearn <noreply@englearn.art>'
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || ''
  },
  ai: {
    enabled: process.env.AI_ENABLED !== 'false',
    aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8001',
    ollamaUrl: process.env.OLLAMA_URL || process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    visionModel: process.env.AI_VISION_MODEL || 'qwen2.5vl:7b',
    tier2Mode: process.env.AI_TIER2_MODE || 'off', // 'off' | 'async' | 'sync'
    tier1TimeoutMs: parseInt(process.env.AI_TIER1_TIMEOUT_MS, 10) || 5000,
    tier2TimeoutMs: parseInt(process.env.AI_TIER2_TIMEOUT_MS, 10) || 15000,
    tier2Concurrency: parseInt(process.env.AI_TIER2_CONCURRENCY, 10) || 1,
    tier2MaxQueue: parseInt(process.env.AI_TIER2_MAX_QUEUE, 10) || 20,
    cacheMaxEntries: parseInt(process.env.AI_CACHE_MAX, 10) || 1000,
    cacheTtlMs: parseInt(process.env.AI_CACHE_TTL_MS, 10) || 30 * 60 * 1000,
    cachePersistPath: process.env.AI_CACHE_PERSIST_PATH === 'none'
      ? null
      : (process.env.AI_CACHE_PERSIST_PATH || path.resolve(__dirname, '../../uploads/.ai-cache.json')),
    thresholds: {
      lowSim: parseFloat(process.env.AI_T_LOW_SIM ?? calibrated.T_LOW_SIM ?? 0.06),
      oodMargin: parseFloat(process.env.AI_T_OOD_MARGIN ?? calibrated.T_OOD_MARGIN ?? -0.01),
      highProb: parseFloat(process.env.AI_T_HIGH_PROB ?? calibrated.T_HIGH_PROB ?? 0.50),
      probMargin: parseFloat(process.env.AI_PROB_MARGIN ?? calibrated.PROB_MARGIN ?? 0.20),
      vlmConfidence: parseFloat(process.env.AI_VLM_MIN_CONF ?? 0.55)
    }
  }
};
