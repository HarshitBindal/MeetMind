const express = require('express');
const { register, login, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes — no token needed
router.post('/register', register);
router.post('/login', login);

// Private route — token required
router.get('/me', protect, getMe);

module.exports = router;
