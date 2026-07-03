const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  workingHours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '17:00' }
  },
  slotDuration: {
    type: Number,
    default: 30
  },
  leaveDays: [
    {
      type: String
    }
  ],
  bio: {
    type: String
  },
  experience: {
    type: Number
  },
  consultationFee: {
    type: Number
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);