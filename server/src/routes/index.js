const express = require('express');

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const topicRoutes = require('./topic.routes');
const vocabularyRoutes = require('./vocabulary.routes');
const userVocabListRoutes = require('./userVocabList.routes');
const exerciseRoutes = require('./exercise.routes');
const reviewRoutes = require('./review.routes');
const adminRoutes = require('./admin.routes');
const statsRoutes = require('./stats.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/topics', topicRoutes);
router.use('/vocabularies', vocabularyRoutes);
router.use('/vocab-lists', userVocabListRoutes);
router.use('/exercises', exerciseRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);
router.use('/stats', statsRoutes);

module.exports = router;
