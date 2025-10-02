// server.js
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 ChitFund API Server is running on port ${PORT}`);
  console.log(`🌍 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  if (process.env.NODE_ENV === 'development') {
    console.log(`📝 API Documentation: http://localhost:${PORT}/api`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received: shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received: shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
