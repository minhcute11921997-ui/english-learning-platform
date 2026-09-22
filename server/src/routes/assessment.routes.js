const express = require('express');
const assessmentController = require('../controllers/assessment.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/start', assessmentController.getQuestions);
router.post('/submit', authenticate, assessmentController.submitAssessment);
router.get('/history', authenticate, assessmentController.getHistory);

module.exports = router;
