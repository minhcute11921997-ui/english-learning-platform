const express = require('express');
const vocabularyController = require('../controllers/vocabulary.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/search', optionalAuth, vocabularyController.searchVocabularies);
router.get('/topic/:id', optionalAuth, vocabularyController.getVocabulariesByTopic);
router.get('/:id', optionalAuth, vocabularyController.getVocabularyById);
router.post('/:id/learn', authenticate, vocabularyController.markAsLearned);

module.exports = router;
