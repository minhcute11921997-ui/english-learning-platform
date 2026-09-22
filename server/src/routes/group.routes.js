const express = require('express');
const { body } = require('express-validator');
const groupController = require('../controllers/group.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  [body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Tên nhóm từ 2-100 ký tự'), validate],
  groupController.createGroup
);

router.get('/my', groupController.getMyGroups);
router.post('/join', groupController.joinGroup);
router.get('/:id', groupController.getGroupById);
router.put('/:id', groupController.updateGroup);
router.delete('/:id/members/:userId', groupController.removeMember);
router.post('/:id/regenerate-code', groupController.regenerateInviteCode);

// Group Content
router.post('/:id/vocab-sets', groupController.createGroupVocabSet);
router.post('/:id/vocab-sets/:setId/publish', groupController.publishGroupVocabSet);
router.post('/:id/reading-sets', groupController.addGroupReading);

// Group Tracking
router.get('/:id/progress', groupController.getGroupProgress);

module.exports = router;
