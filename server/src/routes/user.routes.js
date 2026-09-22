const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(authenticate);

router.put(
  '/profile',
  [body('full_name').optional().notEmpty().withMessage('Họ và tên không được để trống'), validate],
  userController.updateProfile
);

router.put(
  '/password',
  [
    body('currentPassword').notEmpty().withMessage('Vui lòng nhập mật khẩu hiện tại'),
    body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới tối thiểu 6 ký tự'),
    validate
  ],
  userController.changePassword
);

router.put(
  '/learning-goal',
  [body('learning_goal').notEmpty().withMessage('Vui lòng nhập mục tiêu học tập'), validate],
  userController.setLearningGoal
);

router.post('/avatar', upload.single('avatar'), userController.uploadAvatar);

module.exports = router;
