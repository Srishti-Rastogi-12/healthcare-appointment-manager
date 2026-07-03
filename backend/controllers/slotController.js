const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

// Helper function to turn a time string "HH:MM" into total day minutes
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to convert minutes back into a readable "HH:MM" stamp
const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// @desc    Get all available open time slots for a specific doctor on a chosen date
// @route   GET /api/slots/available
exports.getAvailableSlots = async (req, res) => {
  try {
    const targetDoctorId = req.query.doctorId;
    const targetDate = req.query.date;

    // Validation (Checked cleanly once)
    if (!targetDoctorId || !targetDate) {
      return res.status(400).json({ message: 'Please provide both doctorId and date parameter' });
    }

    // 1. Fetch doctor setup metadata profile
    const doctorProfile = await Doctor.findOne({ user: targetDoctorId });
    if (!doctorProfile) {
      return res.status(404).json({ message: 'Doctor configuration profile not found' });
    }

    // 2. Check if the doctor is currently on leave on this date
    if (doctorProfile.leaveDays.includes(targetDate)) {
      return res.status(200).json({ message: 'Doctor is on leave on this date', slots: [] });
    }

    // 3. Extract the configured shift hours and allocation intervals
    const startMins = timeToMinutes(doctorProfile.workingHours.start);
    const endMins = timeToMinutes(doctorProfile.workingHours.end);
    const step = doctorProfile.slotDuration; // e.g., 30 minutes

    // 4. Generate all theoretical maximum slots for the shift
    const totalPossibleSlots = [];
    for (let current = startMins; current + step <= endMins; current += step) {
      totalPossibleSlots.push(minutesToTime(current));
    }

    // 5. Query existing active database bookings for that doctor on that date
    const bookedAppointments = await Appointment.find({
      doctor: targetDoctorId,
      appointmentDate: targetDate,
      status: { $in: ['booked', 'rescheduled'] } // Only match active, non-canceled records
    });

    // Map them into a fast lookup list of taken string stamps, e.g., ["09:30", "10:00"]
    const takenSlots = bookedAppointments.map((app) => app.slotTime);

    // 6. Filter out the taken entries to isolate the open available slots
    const availableSlots = totalPossibleSlots.filter((slot) => !takenSlots.includes(slot));

    res.status(200).json({
      date: targetDate,
      totalAvailable: availableSlots.length,
      slots: availableSlots
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error processing slot arrays', error: error.message });
  }
};