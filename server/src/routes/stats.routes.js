const express = require('express');
const statsController = require('../controllers/stats.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', optionalAuth, statsController.getOverviewStats);
router.get('/my-progress', authenticate, statsController.getMyProgress);
router.get('/learning-trends', authenticate, statsController.getLearningTrends);

module.exports = router;
