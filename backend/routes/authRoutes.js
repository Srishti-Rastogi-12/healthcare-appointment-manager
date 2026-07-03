const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getDoctorUsers } = require('../controllers/authController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Register route
router.post('/register', registerUser);

// Login route
router.post('/login', loginUser);

// Get all doctor users (Admin only)
router.get('/doctors', protect, authorizeRoles('admin'), getDoctorUsers);

module.exports = router;