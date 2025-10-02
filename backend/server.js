const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');

// server.js
require('dotenv').config();

const express = require('express');
const adminRoutes = require('./routes/adminRoutes');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use('/api/admin', adminRoutes); // Correctly mounts under /api/admin
app.use('/api/auth', authRoutes);
app.use('/api/member', memberRoutes);
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 ChitFund API Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌍 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`📝 API Documentation: http://localhost:${PORT}/api`);
  }
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app; 