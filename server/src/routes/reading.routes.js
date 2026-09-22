const express = require('express');
const readingController = require('../controllers/reading.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/recommended', authenticate, readingController.getRecommended);
router.get('/', optionalAuth, readingController.getAllReadings);
router.get('/:id', optionalAuth, readingController.getReadingById);
router.post('/:id/attempt', authenticate, readingController.submitReadingAttempt);
router.get('/:id/results', authenticate, readingController.getReadingResults);

module.exports = router;
