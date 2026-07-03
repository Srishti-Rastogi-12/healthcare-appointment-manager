# Healthcare Appointment Manager

A robust, full-stack MERN (MongoDB, Express, React, Node.js) web application designed to streamline healthcare scheduling, manage patient-doctor allocations, and automate appointment workflows. The platform provides tailor-made dashboards for Admins, Doctors, and Patients alongside an automated notification engine.

## 🚀 Key Features

*   **Role-Based Dashboards:** Distinct user experiences and analytical views for Patients, Doctors, and Administrators.
*   **Appointment Lifecycle Management:** Seamlessly book, reschedule, cancel, or approve appointments in real time.
*   **Automated Email Reminders:** Integrated email service with an asynchronous queueing system to prevent drop-offs.
*   **Cron-based Reminder Jobs:** Background schedules that scan the database and trigger notifications ahead of upcoming appointments.
*   **Modern UI/UX:** Responsive interfaces built with React, Vite, and modern styling architectures.

---

## 📁 Project Structure

The repository is cleanly structured into a decoupled architecture separating frontend and backend contexts:

```text
healthcare-appointment-manager/
├── backend/
│   ├── models/
│   │   └── EmailQueue.js       # Dynamic email tracking schemas
│   ├── utils/
│   │   ├── emailService.js     # Nodemailer / SMTP configurations
│   │   └── reminderJob.js      # Cron job automation for reminders
│   ├── package.json
│   └── server.js               # Express application entry point
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/          # AdminDashboard components
│   │   │   ├── doctor/         # DoctorDashboard components
│   │   │   └── patient/        # PatientDashboard components
│   │   ├── utils/
│   │   │   └── api.js          # Centralized Axios/Fetch API core
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── vercel.json                 # Serverless deployment configuration
└── README.md
