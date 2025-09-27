const { initializeDatabase } = require('../config/database');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const initDB = async () => {
  try {
    console.log('Initializing database...');
    
    // Initialize database tables
    await initializeDatabase();
    
    // Check if admin user exists
    const [adminUsers] = await pool.execute(
      'SELECT id FROM users WHERE role = "admin"'
    );
    
    if (adminUsers.length === 0) {
      console.log('Creating default admin user...');
      
      // Create default admin user
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@chitfund.com';
      
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      await pool.execute(`
        INSERT INTO users (firstName, lastName, email, phone, address, idType, idNumber, password, role, status) 
        VALUES ('Admin', 'User', ?, '0000000000', 'System', 'pan', 'ADMIN0000A', ?, 'admin', 'approved')
      `, [adminEmail, hashedPassword]);
      
      console.log('Default admin user created successfully');
      console.log(`Admin Credentials: ${adminUsername} / ${adminPassword}`);
    }
    
    console.log('Database initialization completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
};

initDB();