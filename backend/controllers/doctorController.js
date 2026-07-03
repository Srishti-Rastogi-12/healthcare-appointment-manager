const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { sendMailWithQueue } = require('../utils/emailService');

// @desc    Create or update doctor profile (Admin only)
// @route   POST /api/doctors/profile
exports.upsertDoctorProfile = async (req, res) => {
  try {
    const { 
      userId, specialization, workingHours, slotDuration, 
      leaveDays, bio, experience, consultationFee, isAvailable 
    } = req.body;

    // 1. Double check if the user actually exists and is registered as a doctor
    const user = await User.findById(userId);
    if (!user || user.role !== 'doctor') {
      return res.status(400).json({ message: 'User must exist and have the role of doctor' });
    }

    // 2. Find if profile already exists, if so update it. If not, create a new one.
    // "upsert" means Update + Insert combined
    let profile = await Doctor.findOne({ user: userId });

    if (profile) {
      // Update existing profile
      profile = await Doctor.findOneAndUpdate(
        { user: userId },
        { specialization, workingHours, slotDuration, leaveDays, bio, experience, consultationFee, isAvailable },
        { new: true, runValidators: true }
      );

      // Check leave conflicts and notify patients
      if (leaveDays && leaveDays.length > 0) {
        const conflictingAppointments = await Appointment.find({
          doctor: userId,
          appointmentDate: { $in: leaveDays },
          status: { $in: ['booked', 'rescheduled'] }
        }).populate('patient', 'name email');

        for (const app of conflictingAppointments) {
          app.status = 'cancelled';
          await app.save();

          if (app.patient && app.patient.email) {
            const subject = '⚠️ Appointment Cancelled: Doctor on Leave';
            const html = `
              <h2>⚠️ Appointment Cancellation Notice</h2>
              <p>Dear ${app.patient.name},</p>
              <p>We regret to inform you that your appointment with <strong>Dr. ${user.name}</strong> on <strong>${app.appointmentDate}</strong> at <strong>${app.slotTime}</strong> has been cancelled because the doctor is on leave on this date.</p>
              <p>Please log in to your patient portal to choose another date or doctor.</p>
              <p>We apologize for the inconvenience.</p>
              <br>
              <p>Best regards,<br>CareSync Clinic Administration</p>
            `;
            await sendMailWithQueue(app.patient.email, subject, html);
          }
        }
      }

      return res.status(200).json({ message: 'Doctor profile updated successfully and leave conflicts processed', profile });
    }

    // Create a new profile if it didn't exist
    profile = await Doctor.create({
      user: userId,
      specialization,
      workingHours,
      slotDuration,
      leaveDays,
      bio,
      experience,
      consultationFee,
      isAvailable
    });

    res.status(201).json({ message: 'Doctor profile created successfully', profile });
  } catch (error) {
    res.status(500).json({ message: 'Server error processing profile', error: error.message });
  }
};

// @desc    Get all doctors with their user information populated (Patient search)
// @route   GET /api/doctors
exports.getAllDoctors = async (req, res) => {
  try {
    // .populate('user', 'name email phone') grabs those specific fields from the User document linked to it!
    const doctors = await Doctor.find({ isAvailable: true }).populate('user', 'name email phone');
    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching doctors', error: error.message });
  }
};