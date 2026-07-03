const express = require('express');
const router = express.Router();
const { upsertDoctorProfile, getAllDoctors } = require('../controllers/doctorController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware'); // Import middleware

// Patient search endpoint (Publicly viewable by logged-in users)
router.get('/', protect, getAllDoctors);

// Admin update endpoint (Protected: ONLY logged-in users with the 'admin' role can execute this)
router.post('/profile', protect, authorizeRoles('admin'), upsertDoctorProfile);

module.exports = router;