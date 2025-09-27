const { pool } = require('../config/database');

// Create a new user
const createUser = async (user) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    address,
    idType,
    idNumber,
    password,
    role = 'member',
    status = 'pending'
  } = user;

  const [result] = await pool.query(
    `INSERT INTO users 
     (firstName, lastName, email, phone, address, idType, idNumber, password, role, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [firstName, lastName, email, phone, address, idType, idNumber, password, role, status]
  );

  return { id: result.insertId, ...user };
};

// Find user by email
const findUserByEmail = async (email) => {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0] || null;
};

// Find user by ID
const findUserById = async (id) => {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
};

// Update user status (approve, suspend, etc.)
const updateUserStatus = async (id, status) => {
  await pool.query(
    'UPDATE users SET status = ? WHERE id = ?',
    [status, id]
  );
  return true;
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserStatus,
};
