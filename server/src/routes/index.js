const express = require('express');

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const assessmentRoutes = require('./assessment.routes');
const topicRoutes = require('./topic.routes');
const vocabularyRoutes = require('./vocabulary.routes');
const exerciseRoutes = require('./exercise.routes');
const reviewRoutes = require('./review.routes');
const readingRoutes = require('./reading.routes');
const groupRoutes = require('./group.routes');
const communityRoutes = require('./community.routes');
const adminRoutes = require('./admin.routes');
const statsRoutes = require('./stats.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/assessment', assessmentRoutes);
router.use('/topics', topicRoutes);
router.use('/vocabularies', vocabularyRoutes);
router.use('/exercises', exerciseRoutes);
router.use('/reviews', reviewRoutes);
router.use('/readings', readingRoutes);
router.use('/groups', groupRoutes);
router.use('/community', communityRoutes);
router.use('/admin', adminRoutes);
router.use('/stats', statsRoutes);

module.exports = router;
