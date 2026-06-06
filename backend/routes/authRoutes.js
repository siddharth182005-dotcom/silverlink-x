'use strict';
const express = require('express');
const router = express.Router();
const { signup, login, getProfile } = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', auth, getProfile);

module.exports = router;
