const fs = require('fs');
const multer = require('multer');
const path = require('path');
const config = require('../config/app');
const AppError = require('../utils/AppError');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Chỉ hỗ trợ file ảnh định dạng JPG, PNG, WEBP, GIF, SVG.', 400), false);
  }
};

/**
 * Kiểm tra chữ ký nhị phân (Magic Bytes) để chống giả mạo đuôi file upload.
 */
function hasValidImageSignature(buffer, mimetype = '') {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true;
  }
  // GIF: GIF87a / GIF89a
  const head4 = buffer.subarray(0, 4).toString('ascii');
  if (head4 === 'GIF8') {
    return true;
  }
  // WebP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return true;
  }
  // SVG (kiểm tra thẻ mở hợp lệ và chặn script nhúng)
  if (mimetype === 'image/svg+xml') {
    const text = buffer.toString('utf8').trimStart();
    const looksLikeSvg = /^<\?xml/i.test(text) || /^<svg[\s>]/i.test(text);
    const hasActiveScript = /<script[\s>]|on\w+\s*=|javascript:/i.test(text);
    return looksLikeSvg && !hasActiveScript;
  }

  return false;
}

const validateImageSignature = (req, res, next) => {
  if (!req.file || !req.file.path) return next();
  try {
    const fd = fs.openSync(req.file.path, 'r');
    const header = Buffer.alloc(4096);
    const bytesRead = fs.readSync(fd, header, 0, header.length, 0);
    fs.closeSync(fd);

    const slice = header.subarray(0, bytesRead);
    if (!hasValidImageSignature(slice, req.file.mimetype)) {
      fs.unlink(req.file.path, () => {});
      return next(new AppError('Nội dung file không khớp với định dạng ảnh hợp lệ.', 400));
    }
    return next();
  } catch (err) {
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    return next(err);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter
});

upload.hasValidImageSignature = hasValidImageSignature;
upload.validateImageSignature = validateImageSignature;

module.exports = upload;
