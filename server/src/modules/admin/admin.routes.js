const express = require('express');
const router = express.Router();
const controller = require('./admin.controller');

/**
 * Admin endpoints for matching & monitoring
 */

// Manually trigger matching cycle
router.post('/run-matching', controller.runMatching);

// Get recent matching cycles
router.get('/matching-cycles', controller.getMatchingCycles);

// Get system health
router.get('/health', controller.getHealth);

module.exports = router;
