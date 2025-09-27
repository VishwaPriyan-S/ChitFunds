const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class AuthService {
  // Get all members (for admin)
  static async getAllMembers(filters = {}) {
    let query = `
      SELECT id, firstName, lastName, email, phone, address, idType, idNumber, 
             role, status, createdAt, updatedAt 
      FROM users 
      WHERE role = 'member'
    `;
    let params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.search) {
      query += ' AND (firstName LIKE ? OR lastName LIKE ? OR email LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY createdAt DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
      
      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(parseInt(filters.offset));
      }
    }

    const [members] = await pool.execute(query, params);
    return members;
  }

  // Get member count
  static async getMemberCount(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM users WHERE role = "member"';
    let params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.search) {
      query += ' AND (firstName LIKE ? OR lastName LIKE ? OR email LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const [result] = await pool.execute(query, params);
    return result[0].total;
  }

  // Get member by ID
  static async getMemberById(id) {
    const [members] = await pool.execute(
      'SELECT id, firstName, lastName, email, phone, address, idType, idNumber, role, status, createdAt FROM users WHERE id = ? AND role = "member"',
      [id]
    );
    return members[0] || null;
  }

  // Approve member
  static async approveMember(id) {
    const [result] = await pool.execute(
      'UPDATE users SET status = "approved", updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND role = "member"',
      [id]
    );
    return result.affectedRows > 0;
  }

  // Reject member
  static async rejectMember(id) {
    const [result] = await pool.execute(
      'UPDATE users SET status = "rejected", updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND role = "member"',
      [id]
    );
    return result.affectedRows > 0;
  }

  // Delete member
  static async deleteMember(id) {
    // First check if member has active chit participations
    const [activeChits] = await pool.execute(
      'SELECT COUNT(*) as count FROM chit_members WHERE userId = ? AND status = "active"',
      [id]
    );

    if (activeChits[0].count > 0) {
      throw new Error('Cannot delete member with active chit participations');
    }

    const [result] = await pool.execute(
      'DELETE FROM users WHERE id = ? AND role = "member"',
      [id]
    );
    return result.affectedRows > 0;
  }

  // Update member status
  static async updateMemberStatus(id, status) {
    const validStatuses = ['pending', 'approved', 'rejected', 'suspended'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    const [result] = await pool.execute(
      'UPDATE users SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND role = "member"',
      [status, id]
    );
    return result.affectedRows > 0;
  }

  // Check if email exists
  static async emailExists(email, excludeId = null) {
    let query = 'SELECT id FROM users WHERE email = ?';
    let params = [email];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [users] = await pool.execute(query, params);
    return users.length > 0;
  }

  // Check if ID number exists
  static async idNumberExists(idType, idNumber, excludeId = null) {
    let query = 'SELECT id FROM users WHERE idType = ? AND idNumber = ?';
    let params = [idType, idNumber];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [users] = await pool.execute(query, params);
    return users.length > 0;
  }

  // Create new member
  static async createMember(memberData) {
    const {
      firstName, lastName, email, phone, address,
      idType, idNumber, password
    } = memberData;

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const [result] = await pool.execute(`
      INSERT INTO users 
      (firstName, lastName, email, phone, address, idType, idNumber, password, role, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'member', 'pending')
    `, [firstName, lastName, email, phone, address, idType, idNumber, hashedPassword]);

    return result.insertId;
  }

  // Update member profile
  static async updateMemberProfile(id, profileData) {
    const { firstName, lastName, phone, address } = profileData;

    const [result] = await pool.execute(`
      UPDATE users 
      SET firstName = ?, lastName = ?, phone = ?, address = ?, updatedAt = CURRENT_TIMESTAMP 
      WHERE id = ? AND role = 'member'
    `, [firstName, lastName, phone, address, id]);

    return result.affectedRows > 0;
  }

  // Change password
  static async changePassword(id, currentPassword, newPassword) {
    // Get current password hash
    const [users] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const [result] = await pool.execute(
      'UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedNewPassword, id]
    );

    return result.affectedRows > 0;
  }

  // Get dashboard statistics for admin
  static async getAdminDashboardStats() {
    const stats = {};

    // Total members
    const [totalMembers] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE role = "member"'
    );
    stats.totalMembers = totalMembers[0].count;

    // Approved members
    const [approvedMembers] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE role = "member" AND status = "approved"'
    );
    stats.approvedMembers = approvedMembers[0].count;

    // Pending members
    const [pendingMembers] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE role = "member" AND status = "pending"'
    );
    stats.pendingMembers = pendingMembers[0].count;

    // Rejected members
    const [rejectedMembers] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE role = "member" AND status = "rejected"'
    );
    stats.rejectedMembers = rejectedMembers[0].count;

    // Active chit groups
    const [activeChits] = await pool.execute(
      'SELECT COUNT(*) as count FROM chit_groups WHERE status = "active"'
    );
    stats.activeChitGroups = activeChits[0].count;

    // Total transaction amount
    const [totalTransactions] = await pool.execute(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = "completed"'
    );
    stats.totalTransactionAmount = totalTransactions[0].total;

    // Recent members
    const [recentMembers] = await pool.execute(`
      SELECT id, firstName, lastName, email, status, createdAt 
      FROM users 
      WHERE role = 'member' 
      ORDER BY createdAt DESC 
      LIMIT 5
    `);
    stats.recentMembers = recentMembers;

    return stats;
  }
}

module.exports = AuthService;