const express = require('express');
const reviewController = require('../controllers/review.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/due', reviewController.getDueReviews);
router.get('/upcoming', reviewController.getUpcomingReviews);
router.get('/stats', reviewController.getReviewStats);
router.post('/:vocabId/answer', reviewController.answerReview);

module.exports = router;
