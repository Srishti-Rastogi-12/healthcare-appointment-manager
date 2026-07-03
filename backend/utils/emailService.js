const nodemailer = require('nodemailer');
const EmailQueue = require('../models/EmailQueue');

// Create the email transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,     // Your business/personal Gmail address
    pass: process.env.EMAIL_PASS,     // Your Gmail App Password
  },
});

/**
 * Sends mail directly via Nodemailer (used by retry job)
 */
const sendMailDirect = async (to, subject, html) => {
  const mailOptions = {
    from: `"CareSync Healthcare" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };
  return await transporter.sendMail(mailOptions);
};

/**
 * Attempts to send email immediately. If it fails, queues it in database for retries.
 */
const sendMailWithQueue = async (to, subject, html) => {
  try {
    console.log(`Attempting immediate email to ${to}...`);
    const info = await sendMailDirect(to, subject, html);
    console.log('✉️ Email sent successfully immediately:', info.messageId);
    return info;
  } catch (error) {
    console.error(`❌ Immediate email to ${to} failed, queueing for retry:`, error.message);
    try {
      await EmailQueue.create({
        to,
        subject,
        html,
        attempts: 1,
        status: 'failed',
        error: error.message,
        nextAttemptAt: new Date(Date.now() + 5 * 60000) // retry in 5 minutes
      });
      console.log('💾 Email successfully queued in database.');
    } catch (dbError) {
      console.error('⚠️ Critical: Failed to write to email queue database:', dbError.message);
    }
  }
};

/**
 * Sends a booking confirmation email (updates to use the queue wrapper on failure)
 */
const sendBookingEmail = async (patientEmail, appointmentDetails) => {
  const subject = '🏥 Appointment Booking Confirmed!';
  const html = `
    <h2>Your Appointment is Confirmed!</h2>
    <p><strong>Date:</strong> ${appointmentDetails.date}</p>
    <p><strong>Time:</strong> ${appointmentDetails.time}</p>
    <p><strong>Chief Complaint:</strong> ${appointmentDetails.chiefComplaint}</p>
    <br>
    <p>Thank you for choosing our healthcare network. If you need to reschedule, please visit your patient portal.</p>
  `;
  return await sendMailWithQueue(patientEmail, subject, html);
};

module.exports = { 
  sendBookingEmail, 
  sendMailDirect, 
  sendMailWithQueue 
};