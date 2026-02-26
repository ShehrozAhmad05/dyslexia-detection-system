const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Database Connection
console.log(process.env.MONGO_URI)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dyslexia_detection')
  .then(() => console.log('✓ MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Auth routes
app.use('/api/auth', require('./routes/auth'));

// Assessment routes
app.use('/api/handwriting', require('./routes/handwriting'));
app.use('/api/reading', require('./routes/reading'));
app.use('/api/keystroke', require('./routes/keystroke'));

// Import other routes (to be created)
// app.use('/api/users', require('./routes/users'));
// app.use('/api/assessments', require('./routes/assessments'));
// app.use('/api/keystroke', require('./routes/keystroke'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
