const express = require('express');
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');
const uploadMemory = require('../middleware/uploadMemory');

const router = express.Router();

router.get('/health', aiController.getAiHealth);
router.post('/identify', authenticate, aiLimiter, uploadMemory.single('image'), aiController.identifyImage);
router.get('/refine/:jobId', authenticate, aiController.getRefineStatus);
router.post('/feedback', authenticate, aiController.submitFeedback);

module.exports = router;
