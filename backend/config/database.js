const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'vipvipvp',
  database: process.env.DB_NAME || 'chitfunds',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});

// Get promise-based pool
const promisePool = pool.promise();

// Test connection
const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log('Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

// Initialize database tables
const initializeDatabase = async () => {
  try {
    await testConnection();
    
    // Create users table
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        firstName VARCHAR(100) NOT NULL,
        lastName VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(15),
        address TEXT,
        idType ENUM('aadhaar', 'pan', 'voter', 'passport') NOT NULL,
        idNumber VARCHAR(50) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'member') DEFAULT 'member',
        status ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create chit_groups table
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS chit_groups (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(200) NOT NULL,
        totalAmount DECIMAL(15,2) NOT NULL,
        monthlyContribution DECIMAL(15,2) NOT NULL,
        duration INT NOT NULL, -- in months
        totalMembers INT NOT NULL,
        status ENUM('active', 'completed', 'suspended') DEFAULT 'active',
        startDate DATE,
        endDate DATE,
        createdBy INT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (createdBy) REFERENCES users(id)
      )
    `);

    // Create chit_members table (relationship between users and chit groups)
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS chit_members (
        id INT PRIMARY KEY AUTO_INCREMENT,
        chitGroupId INT NOT NULL,
        userId INT NOT NULL,
        joinedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        status ENUM('active', 'withdrawn', 'defaulter') DEFAULT 'active',
        hasReceived BOOLEAN DEFAULT FALSE,
        receivedAmount DECIMAL(15,2) DEFAULT 0,
        receivedMonth INT DEFAULT 0,
        FOREIGN KEY (chitGroupId) REFERENCES chit_groups(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_member_group (chitGroupId, userId)
      )
    `);

    // Create transactions table
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        chitGroupId INT NOT NULL,
        userId INT NOT NULL,
        type ENUM('contribution', 'payout', 'penalty', 'refund') NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        month INT NOT NULL,
        year INT NOT NULL,
        status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
        description TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (chitGroupId) REFERENCES chit_groups(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create auctions table
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS auctions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        chitGroupId INT NOT NULL,
        month INT NOT NULL,
        year INT NOT NULL,
        minBidAmount DECIMAL(15,2) NOT NULL,
        winningBidAmount DECIMAL(15,2),
        winnerId INT,
        status ENUM('scheduled', 'active', 'completed', 'cancelled') DEFAULT 'scheduled',
        auctionDate DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (chitGroupId) REFERENCES chit_groups(id) ON DELETE CASCADE,
        FOREIGN KEY (winnerId) REFERENCES users(id),
        UNIQUE KEY unique_auction_month (chitGroupId, month, year)
      )
    `);

    // Create bids table
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS bids (
        id INT PRIMARY KEY AUTO_INCREMENT,
        auctionId INT NOT NULL,
        userId INT NOT NULL,
        bidAmount DECIMAL(15,2) NOT NULL,
        bidTime DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (auctionId) REFERENCES auctions(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('Database tables initialized successfully');

  } catch (error) {
    console.error('Database initialization error:', error.message);
    process.exit(1);
  }
};

module.exports = {
  pool: promisePool,
  initializeDatabase
};