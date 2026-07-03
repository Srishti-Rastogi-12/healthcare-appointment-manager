const { google } = require('googleapis');
const path = require('path');

// Path to your downloaded credentials key file
const KEYFILEPATH = path.join(__dirname, 'google-key.json'); 

// Define the required scopes (Read and Write access to Calendar)
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Authenticate using the Service Account key
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

const calendar = google.calendar({ version: 'v3', auth });


/**
 * Creates a new appointment event in Google Calendar
 * @param {Object} appointment - The appointment details from your backend
 * @param {string} appointment.summary - E.g., "Patient Checkup: John Doe"
 * @param {string} appointment.description - E.g., "Routine health tracking evaluation"
 * @param {string} appointment.startTime - ISO string format (e.g., "2026-07-10T10:00:00Z")
 * @param {string} appointment.endTime - ISO string format (e.g., "2026-07-10T10:30:00Z")
 */
const createCalendarEvent = async (appointment) => {
  try {
    const event = {
      summary: appointment.summary,
      description: appointment.description,
      start: {
        dateTime: appointment.startTime,
        timeZone: 'Asia/Kolkata', // Sets the timezone to IST
      },
      end: {
        dateTime: appointment.endTime,
        timeZone: 'Asia/Kolkata',
      },
    };

    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      resource: event,
    });

    console.log('✅ Google Calendar Event created successfully:', response.data.htmlLink);
    return response.data;
  } catch (error) {
    console.error('❌ Error creating Google Calendar event:', error);
    throw error;
  }
};

module.exports = { calendar, createCalendarEvent };