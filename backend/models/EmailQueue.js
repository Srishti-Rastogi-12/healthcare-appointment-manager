const mongoose = require('mongoose');

const emailQueueSchema = new mongoose.Schema({
  to: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  subject: {
    type: String,
    required: true
  },
  html: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  error: {
    type: String
  },
  nextAttemptAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('EmailQueue', emailQueueSchema);
