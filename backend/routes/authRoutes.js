const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { pool } = require('../config/database');
const { 
  validateUserRegistration, 
  validateUserLogin, 
  validateAdminLogin 
} = require('../utils/validation');

const router = express.Router();

// Rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new member
// @access  Public
router.post('/register', async (req, res) => {
  try {
    // Validate input
    const { error } = validateUserRegistration(req.body);
    if (error) {
      return res.status(400).json({ 
        message: error.details[0].message 
      });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      idType,
      idNumber,
      password
    } = req.body;

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ? OR (idType = ? AND idNumber = ?)',
      [email, idType, idNumber]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        message: 'User already exists with this email or ID number' 
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const [result] = await pool.execute(
      `INSERT INTO users (firstName, lastName, email, phone, address, idType, idNumber, password, role, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'member', 'pending')`,
      [firstName, lastName, email, phone, address, idType, idNumber, hashedPassword]
    );

    // Get the created user (without password)
    const [newUser] = await pool.execute(
      'SELECT id, firstName, lastName, email, phone, role, status, createdAt FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Registration successful! Please wait for admin approval.',
      user: newUser[0]
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login member
// @access  Public
router.post('/login', authLimiter, async (req, res) => {
  try {
    // Validate input
    const { error } = validateUserLogin(req.body);
    if (error) {
      return res.status(400).json({ 
        message: error.details[0].message 
      });
    }

    const { email, password } = req.body;

    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id, firstName, lastName, email, phone, password, role, status, createdAt FROM users WHERE email = ? AND role = "member"',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check account status
    if (user.status === 'rejected') {
      return res.status(401).json({ message: 'Your account has been rejected. Please contact admin.' });
    }

    if (user.status === 'suspended') {
      return res.status(401).json({ message: 'Your account has been suspended. Please contact admin.' });
    }

    // Generate token
    const token = generateToken(user);

    // Remove password from response
    delete user.password;

    res.json({
      message: 'Login successful',
      token,
      data: user
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login' });
  }
});

// @route   POST /api/auth/admin/login
// @desc    Login admin
// @access  Public
router.post('/admin/login', authLimiter, async (req, res) => {
  try {
    // Validate input
    const { error } = validateAdminLogin(req.body);
    if (error) {
      return res.status(400).json({ 
        message: error.details[0].message 
      });
    }

    const { username, password } = req.body;

    // Check against environment variables for admin credentials
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (username !== adminUsername || password !== adminPassword) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Check if admin user exists in database, create if not
    let [adminUsers] = await pool.execute(
      'SELECT id, firstName, lastName, email, role, status FROM users WHERE role = "admin" LIMIT 1'
    );

    let adminUser;

    if (adminUsers.length === 0) {
      // Create admin user
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@chitfund.com';
      
      const [result] = await pool.execute(
        `INSERT INTO users (firstName, lastName, email, phone, address, idType, idNumber, password, role, status) 
         VALUES ('Admin', 'User', ?, '0000000000', 'System', 'pan', 'ADMIN0000A', ?, 'admin', 'approved')`,
        [adminEmail, hashedPassword]
      );

      adminUser = {
        id: result.insertId,
        firstName: 'Admin',
        lastName: 'User',
        email: adminEmail,
        role: 'admin',
        status: 'approved'
      };
    } else {
      adminUser = adminUsers[0];
    }

    // Generate token
    const token = generateToken(adminUser);

    res.json({
      message: 'Admin login successful',
      token,
      role: 'admin',

      data: adminUser
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Internal server error during admin login' });
  }
});

// @route   POST /api/auth/verify-token
// @desc    Verify JWT token
// @access  Private
router.post('/verify-token', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const [users] = await pool.execute(
      'SELECT id, firstName, lastName, email, phone, role, status FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    res.json({
      valid: true,
      data: users[0]
    });

  } catch (error) {
    res.status(401).json({ 
      valid: false,
      message: 'Invalid token' 
    });
  }
});

module.exports = router;