const express = require('express');
const topicController = require('../controllers/topic.controller');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, topicController.getAllTopics);
router.get('/:id', optionalAuth, topicController.getTopicById);

module.exports = router;
