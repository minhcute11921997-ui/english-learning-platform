const express = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

// Quản trị người dùng
router.get('/users', adminController.getUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/status', adminController.toggleUserStatus);

// Quản trị từ vựng
router.post('/vocabularies', adminController.createVocabulary);
router.put('/vocabularies/:id', adminController.updateVocabulary);
router.delete('/vocabularies/:id', adminController.deleteVocabulary);

// Quản trị bài đọc
router.post('/readings', adminController.createReading);
router.put('/readings/:id', adminController.updateReading);
router.delete('/readings/:id', adminController.deleteReading);

// Kiểm duyệt cộng đồng
router.get('/community/pending', adminController.getPendingCommunityPosts);
router.put('/community/:id/review', adminController.reviewCommunityPost);

module.exports = router;
