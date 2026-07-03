const Appointment = require('../models/Appointment');
const EmailQueue = require('../models/EmailQueue');
const { sendMailDirect, sendMailWithQueue } = require('./emailService');

// Helper to extract days from duration string (e.g., "7 days" -> 7, "1 week" -> 7, default to 7)
const parseDurationDays = (durationStr) => {
  if (!durationStr) return 7;
  const num = parseInt(durationStr.replace(/\D/g, ''), 10);
  if (isNaN(num)) return 7;
  if (durationStr.toLowerCase().includes('week')) return num * 7;
  if (durationStr.toLowerCase().includes('month')) return num * 30;
  return num;
};

/**
 * Checks completed appointments and sends medication reminders.
 */
const checkMedicationReminders = async () => {
  try {
    console.log('⏰ Running medication reminders job...');
    const now = new Date();

    // Find all completed appointments with formatted prescription data
    const appointments = await Appointment.find({
      status: 'completed',
      'prescriptionData.formattedPrescription': { $exists: true }
    }).populate('patient', 'name email');

    for (const app of appointments) {
      if (!app.patient || !app.patient.email) continue;

      const prescription = app.prescriptionData.formattedPrescription;
      const generatedAt = app.prescriptionData.generatedAt || app.updatedAt;

      // Extract duration in days (defaulting to max of all medicines' durations)
      let maxDurationDays = 7;
      if (prescription.medications && prescription.medications.length > 0) {
        const durations = prescription.medications.map(m => parseDurationDays(m.duration));
        maxDurationDays = Math.max(...durations);
      }

      // Check if prescription period is active
      const prescriptionExpiry = new Date(generatedAt.getTime() + maxDurationDays * 24 * 60 * 60 * 1000);
      if (now > prescriptionExpiry) {
        // Prescription has expired, skip
        continue;
      }

      // Check if sent in the last 22 hours to prevent double sending in same day
      if (app.lastReminderSentAt && (now.getTime() - app.lastReminderSentAt.getTime() < 22 * 60 * 60 * 1000)) {
        continue;
      }

      // Send medication reminder
      console.log(`✉️ Sending medication reminder to patient ${app.patient.name} (${app.patient.email})...`);
      
      let medListHtml = '';
      if (prescription.medications && prescription.medications.length > 0) {
        medListHtml = `
          <h3>Prescribed Medications:</h3>
          <ul>
            ${prescription.medications.map(med => `
              <li style="margin-bottom: 8px;">
                <strong>💊 ${med.name}</strong> - ${med.dosage} (${med.timing})
              </li>
            `).join('')}
          </ul>
        `;
      }

      const emailHtml = `
        <h2>⏰ Medication & Care Reminder</h2>
        <p>Dear ${app.patient.name},</p>
        <p>This is a scheduled reminder to take your prescribed medications for <strong>${prescription.chiefComplaintConfirmation || 'your treatment'}</strong>.</p>
        
        ${medListHtml}

        <p><strong>Doctor's Notes:</strong> <em>"${prescription.patientNotes}"</em></p>
        
        ${prescription.safetyWarnings ? `
          <div style="background-color: #fff1f2; border: 1px solid #ffe4e6; padding: 12px; border-radius: 8px; margin-top: 15px;">
            <strong style="color: #e11d48;">⚠️ Safety Notice:</strong>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #9f1239;">${prescription.safetyWarnings}</p>
          </div>
        ` : ''}
        
        <br>
        <p>If you experience any severe side effects, please contact the clinic or seek emergency medical care immediately.</p>
      `;

      await sendMailWithQueue(
        app.patient.email,
        `⏰ Medication Reminder: ${prescription.chiefComplaintConfirmation || 'CareSync Therapy'}`,
        emailHtml
      );

      // Update lastReminderSentAt field in appointment
      app.lastReminderSentAt = now;
      await app.save();
    }
  } catch (error) {
    console.error('❌ Error checking medication reminders:', error);
  }
};

/**
 * Retries failed emails from the EmailQueue table.
 */
const retryFailedEmails = async () => {
  try {
    const now = new Date();
    // Query entries that are failed, have attempts < 3, and nextAttemptAt <= now
    const pendingRetries = await EmailQueue.find({
      status: 'failed',
      attempts: { $lt: 3 },
      nextAttemptAt: { $lte: now }
    });

    if (pendingRetries.length === 0) return;

    console.log(`🔄 Found ${pendingRetries.length} failed emails to retry...`);

    for (const email of pendingRetries) {
      email.attempts += 1;
      try {
        console.log(`Retrying email to ${email.to} (Attempt ${email.attempts})...`);
        const info = await sendMailDirect(email.to, email.subject, email.html);
        console.log(`✉️ Email successfully sent on attempt ${email.attempts}! Message ID:`, info.messageId);
        email.status = 'sent';
        email.error = '';
      } catch (sendError) {
        console.error(`❌ Retry attempt ${email.attempts} failed for ${email.to}:`, sendError.message);
        email.error = sendError.message;
        
        if (email.attempts >= 3) {
          console.log(`🚫 Max attempts reached for email to ${email.to}. Setting permanently failed.`);
        } else {
          // Schedule next attempt with exponential backoff (e.g. 5 mins, then 10 mins)
          const delayMinutes = 5 * email.attempts;
          email.nextAttemptAt = new Date(Date.now() + delayMinutes * 60000);
        }
      }
      await email.save();
    }
  } catch (error) {
    console.error('❌ Error retrying failed emails:', error);
  }
};

/**
 * Starts background schedulers on boot.
 */
const startScheduler = () => {
  console.log('🚀 Initializing background reminder and email retry services...');
  
  // Runs email retry task every 1 minute
  setInterval(retryFailedEmails, 1 * 60 * 1000);
  
  // Runs medication reminder checker task every 1 hour
  setInterval(checkMedicationReminders, 60 * 60 * 1000);

  // Run them once immediately on startup after a small delay
  setTimeout(() => {
    retryFailedEmails();
    checkMedicationReminders();
  }, 10000); // 10 seconds post-boot
};

module.exports = { startScheduler };
