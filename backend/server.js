  const app = require('./app');
  require('dotenv').config();
  const PORT = process.env.PORT || 5000;

  // Graceful shutdown handlers
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    process.exit(0);
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 ChitFund API Server is running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌍 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📝 API Documentation: http://localhost:${PORT}/api`);
    }
  });

