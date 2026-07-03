const express = require('express');
const router = express.Router();
const { getAvailableSlots } = require('../controllers/slotController');
const { protect } = require('../middleware/authMiddleware');

// Mount available slots search route under authentication tracking
router.get('/available', protect, getAvailableSlots);

module.exports = router;