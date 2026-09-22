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

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter
});

module.exports = upload;
