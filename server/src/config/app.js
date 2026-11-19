require('dotenv').config();
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
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
};
