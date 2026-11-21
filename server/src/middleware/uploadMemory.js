const multer = require('multer');
const config = require('../config/app');
const AppError = require('../utils/AppError');

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
]);

/**
 * Memory-only multer upload for AI image recognition.
 * Avoids writing untrusted uploads to disk and restricts strictly to raster photos.
 */
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload?.maxFileSize || 5 * 1024 * 1024,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Chỉ hỗ trợ ảnh định dạng JPG, PNG hoặc WEBP (tối đa 5MB).', 400), false);
    }
  }
});

module.exports = uploadMemory;
