const express = require('express');
const exerciseController = require('../controllers/exercise.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/vocab/:topicId', exerciseController.getVocabExercises);
router.post('/vocab/submit', authenticate, exerciseController.submitVocabExercises);

module.exports = router;
