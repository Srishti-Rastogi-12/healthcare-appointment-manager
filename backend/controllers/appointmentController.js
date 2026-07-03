const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
// 1. Import our brand new Gemini AI utility service
const { generatePreVisitSummary, generatePatientPrescriptionAI } = require('../utils/geminiService');

// 🚀 IMPORT GOOGLE CALENDAR UTILITY HERE
const { createCalendarEvent } = require('../config/googleCalendar');

// ✉️ IMPORT EMAIL NOTIFICATION SERVICE HERE
const { sendBookingEmail } = require('../utils/emailService');

// @desc    Book a new appointment slot with automated AI symptoms analysis
// @route   POST /api/appointments
exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, slotTime, symptoms } = req.body;

    // Validate that the required input data is provided
    if (!doctorId || !appointmentDate || !slotTime || !symptoms) {
      return res.status(400).json({ message: 'Please provide all appointment details and symptoms' });
    }

    // Safety Check: Verify that the doctor exists and is available
    const doctorProfile = await Doctor.findOne({ user: doctorId });
    if (!doctorProfile || !doctorProfile.isAvailable) {
      return res.status(404).json({ message: 'Doctor is not available for bookings' });
    }

    // Safety Check: Make sure the doctor hasn't marked this entire day as leave
    if (doctorProfile.leaveDays.includes(appointmentDate)) {
      return res.status(400).json({ message: 'Doctor is on leave on this selected date' });
    }

    // Double-Booking Prevention: Check if this specific slot is already taken
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate,
      slotTime,
      status: { $in: ['booked', 'rescheduled'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'This time slot has already been booked by another patient' });
    }

    // 2. Call the Gemini LLM Engine to analyze the symptoms text in real time!
    console.log("Sending symptoms to Gemini LLM for clinical analysis...");
    const aiSummary = await generatePreVisitSummary(symptoms);
    console.log("Gemini LLM Analysis Complete:", aiSummary);

    // 3. Save the appointment, now attaching our beautiful new AI summary data structures
    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor: doctorId,
      appointmentDate,
      slotTime,
      symptoms,
      // Mapping the JSON fields returned from our gemini utility helper
      preVisitSummary: {
        urgency: aiSummary.urgency,
        chiefComplaint: aiSummary.chiefComplaint,
        suggestedQuestions: aiSummary.suggestedQuestions
      }
    });

    // 📅 4. AUTOMATICALLY PUSH TO GOOGLE CALENDAR
    try {
      // Combines Date (e.g., "2026-07-10") and Time (e.g., "10:00") into ISO format string
      const [datePart] = appointmentDate.split('T'); 
      const startIsoString = `${datePart}T${slotTime}:00`; 

      // Create an end time that is exactly 30 minutes after the start time
      const startTimeObj = new Date(startIsoString);
      const endTimeObj = new Date(startTimeObj.getTime() + 30 * 60000); 
      const endIsoString = endTimeObj.toISOString();

      console.log("Attempting to add event to Google Calendar...");
      await createCalendarEvent({
        summary: `Patient Appointment Booking`,
        description: `Chief Complaint: ${aiSummary.chiefComplaint || symptoms}\nUrgency: ${aiSummary.urgency || 'Normal'}`,
        startTime: startIsoString,
        endTime: endIsoString
      });
    } catch (calendarError) {
      // We wrap this in an inner try-catch block so that if Google Calendar fails, 
      // the patient's database appointment booking STILL succeeds safely.
      console.error("⚠️ Database saved, but Google Calendar failed to sync:", calendarError.message);
    }

    // ✉️ 5. AUTOMATICALLY SEND EMAIL NOTIFICATION
    try {
      console.log("Attempting to send confirmation email to patient...");
      // Assumes your auth middleware attaches the user object with an email onto req.user
      const patientEmail = req.user.email; 

      await sendBookingEmail(patientEmail, {
        date: appointmentDate.split('T')[0],
        time: slotTime,
        chiefComplaint: aiSummary.chiefComplaint || symptoms
      });
    } catch (emailError) {
      console.error("Database saved, but confirmation email failed to send:", emailError.message);
    }

    res.status(201).json({
      message: 'Appointment booked successfully with AI Pre-Visit Analysis, Calendar Sync, and Email Notification!',
      appointment
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Simultaneous booking conflict: This slot was just taken!' });
    }
    res.status(500).json({ message: 'Server error booking appointment', error: error.message });
  }
};

// @desc    Get all appointments for the logged-in doctor
// @route   GET /api/appointments/doctor
exports.getDoctorAppointments = async (req, res) => {
  try {
    // 1. Safety Check: Ensure the user accessing this route is actually a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied: Resource reserved for doctors only' });
    }

    // 2. Fetch all appointments booked for this specific doctor's ID
    // We populate the patient's name and email so the doctor knows who is visiting
    const appointments = await Appointment.find({ doctor: req.user.id })
      .populate('patient', 'name email phone')
      .sort({ appointmentDate: 1, slotTime: 1 }); // Sort chronologically

    res.status(200).json({
      count: appointments.length,
      appointments
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error fetching doctor dashboard', error: error.message });
  }
};

// @desc    Add clinical notes and generate AI-structured prescription
// @route   POST /api/appointments/:id/prescription
// @access  Private (Doctor Only)
exports.addPrescription = async (req, res) => {
  try {
    const { rawDoctorNotes } = req.body;
    const appointmentId = req.params.id;

    // 1. Validation check
    if (!rawDoctorNotes || !rawDoctorNotes.trim()) {
      return res.status(400).json({ message: "Doctor notes cannot be empty." });
    }

    // 2. Find the appointment in the database
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    // 3. Security check: Ensure the logged-in user is actually the assigned doctor
    if (appointment.doctor.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized. You are not the assigned doctor for this appointment." });
    }

    console.log("Sending raw doctor notes to Gemini for structured formatting...");

    // 4. Send the raw shorthand notes to Gemini
    const aiPrescription = await generatePatientPrescriptionAI(rawDoctorNotes);

    // 5. Update the appointment document with the new structured prescription data
    appointment.prescriptionData = {
      rawDoctorNotes: rawDoctorNotes,
      formattedPrescription: aiPrescription,
      generatedAt: new Date()
    };
    
    // Mark the appointment status as completed
    appointment.status = 'completed';

    // 6. Save back to MongoDB
    await appointment.save();

    res.status(200).json({
      message: "Prescription processed by Gemini AI and saved successfully!",
      appointment
    });

  } catch (error) {
    console.error("Error in addPrescription controller:", error);
    res.status(500).json({ message: "Server error while processing prescription." });
  }
};

// @desc    Get all appointments for the logged-in patient
// @route   GET /api/appointments/patient
// @access  Private (Patient Only)
exports.getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user.id })
      .populate('doctor', 'name email phone')
      .sort({ appointmentDate: 1, slotTime: 1 });

    res.status(200).json({
      count: appointments.length,
      appointments
    });
  } catch (error) {
    console.error("Error in getPatientAppointments controller:", error);
    res.status(500).json({ message: "Server error fetching patient appointments." });
  }
};