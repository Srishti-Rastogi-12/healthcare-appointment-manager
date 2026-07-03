
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { startScheduler } = require('./utils/reminderJob');

// 1. Imports (Declared exactly once at the top)
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const slotRoutes = require('./routes/slotRoutes'); // Import slot routes
const appointmentRoutes = require('./routes/appointmentRoutes'); // Import appointment routes

const app = express();

// Connect to MongoDB
connectDB().then(() => {
  // Start background jobs once DB is connected
  startScheduler();
});

// 2. Middleware
app.use(cors());
app.use(express.json());
app.use('/api/slots', slotRoutes);
app.use('/api/appointments', appointmentRoutes);

// 3. Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));