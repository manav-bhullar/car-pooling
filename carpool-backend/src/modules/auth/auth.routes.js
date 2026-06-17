const express = require('express');
const router = express.Router();
const controller = require('./auth.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/verify-email', controller.verifyEmail);
router.post('/resend-otp', controller.resendOtp);
router.post('/refresh-token', controller.refreshToken);

// Protected routes
router.post('/logout', authenticate, controller.logout);
router.get('/me', authenticate, controller.getMe);

module.exports = router;
