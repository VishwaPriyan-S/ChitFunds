const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Look up user from DB
    const [users] = await pool.execute(
      'SELECT id, firstName, lastName, email, phone, role, status FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid token. User not found.' });
    }

    const user = users[0];

    if (user.status === 'suspended' || user.status === 'rejected') {
      return res.status(403).json({ message: 'Account suspended or rejected.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// Require admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin role required.' });
  }
  next();
};

// Require member role
const requireMember = (req, res, next) => {
  if (req.user.role !== 'member') {
    return res.status(403).json({ message: 'Member role required.' });
  }
  next();
};

// Require approved member
const requireApprovedMember = (req, res, next) => {
  if (req.user.role !== 'member') {
    return res.status(403).json({ message: 'Member role required.' });
  }
  if (req.user.status !== 'approved') {
    return res.status(403).json({ message: 'Account pending approval. Please contact admin.' });
  }
  next();
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireMember,
  requireApprovedMember,
};
