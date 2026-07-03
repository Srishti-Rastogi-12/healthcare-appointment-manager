const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointmentDate: {
    type: String, // Stored as "YYYY-MM-DD" for simple match filtering
    required: true
  },
  slotTime: {
    type: String, // Stored as "09:30" or "14:00"
    required: true
  },
  status: {
    type: String,
    enum: ['booked', 'rescheduled', 'cancelled', 'completed'],
    default: 'booked'
  },
  symptoms: {
    type: String,
    required: true
  },
  
  // AI/LLM Pre-Visit Summary Fields (Phase 4)
  preVisitSummary: {
    urgencyLevel: { type: String, enum: ['Low', 'Medium', 'High'] },
    chiefComplaint: { type: String },
    suggestedQuestions: [{ type: String }]
  },

  // Post-Visit Clinical Records & Structured AI Prescription (Phase 4 Update)
  prescriptionData: {
    rawDoctorNotes: {
      type: String,
      default: ""
    },
    formattedPrescription: {
      chiefComplaintConfirmation: String,
      medications: [
        {
          name: String,      // e.g., "Amoxicillin"
          dosage: String,    // e.g., "500mg - 1 capsule"
          duration: String,  // e.g., "7 days"
          timing: String     // e.g., "Three times a day, after meals"
        }
      ],
      patientNotes: String,  // Simplified layperson explanation of the medical advice
      safetyWarnings: String // Automated warnings (e.g., "Avoid alcohol", "Take with plenty of water")
    },
    generatedAt: {
      type: Date,
      default: Date.now
    }
  },

  // Integrations (Phases 5 & 6)
  googleCalendarEventId: {
    type: String
  },
  
  // Track last sent medication reminder date to prevent duplicates (Phase 7)
  lastReminderSentAt: {
    type: Date
  }
}, { timestamps: true });

// CRITICAL: Prevent Double-Booking at Database Level!
appointmentSchema.index({ doctor: 1, appointmentDate: 1, slotTime: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', appointmentSchema);