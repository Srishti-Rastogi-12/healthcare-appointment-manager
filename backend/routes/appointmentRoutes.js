const express = require('express');
const router = express.Router();

// 1. Added addPrescription inside the curly braces here:
const { bookAppointment, getDoctorAppointments, addPrescription, getPatientAppointments } = require('../controllers/appointmentController');

const { protect } = require('../middleware/authMiddleware');

// Route configurations
router.post('/', protect, bookAppointment);
router.get('/doctor', protect, getDoctorAppointments); 
router.get('/patient', protect, getPatientAppointments);

// 2. Added the brand new route for submitting prescriptions:
router.post('/:id/prescription', protect, addPrescription);

module.exports = router;