const express = require('express');
const router = express.Router();
const translateController = require('../controllers/translate.controller');

// Endpoint dịch lựa chọn / bôi đen
router.post('/', translateController.translateSelection);

module.exports = router;
