'use strict';
const express = require('express');
const router = express.Router();
const { chat, getChatHistory, clearChatHistory } = require('../controllers/chatController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, chat);
router.get('/history', auth, getChatHistory);
router.delete('/history', auth, clearChatHistory);

module.exports = router;
