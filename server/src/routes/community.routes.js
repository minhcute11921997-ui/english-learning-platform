const express = require('express');
const { body } = require('express-validator');
const communityController = require('../controllers/community.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/', optionalAuth, communityController.getApprovedPosts);

router.post(
  '/submit',
  authenticate,
  [
    body('content_type').isIn(['vocab_set', 'reading']).withMessage('Loại nội dung không hợp lệ'),
    body('title').trim().notEmpty().withMessage('Tiêu đề không được để trống'),
    validate
  ],
  communityController.submitPost
);

router.get('/my-posts', authenticate, communityController.getMyPosts);
router.post('/:id/upvote', authenticate, communityController.upvotePost);

module.exports = router;
