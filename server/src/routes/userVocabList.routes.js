const express = require('express');
const userVocabListController = require('../controllers/userVocabList.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Quản lý các bộ từ
router.get('/', userVocabListController.getLists);
router.post('/', userVocabListController.createList);
router.get('/words/membership', userVocabListController.getWordMembership);
router.post('/words/sync', userVocabListController.addWordToLists);

router.get('/:id', userVocabListController.getListById);
router.put('/:id', userVocabListController.updateList);
router.delete('/:id', userVocabListController.deleteList);

router.delete('/:listId/words/:vocabId', userVocabListController.removeWordFromList);

module.exports = router;
