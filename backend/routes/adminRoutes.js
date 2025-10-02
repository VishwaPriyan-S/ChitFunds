const express = require('express');
const { pool } = require('../config/database');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');


const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(verifyToken);
router.use(requireAdmin);

// @route   GET /api/admin/members
// @desc    Get all members
// @access  Private (Admin)
router.get('/members', async (req, res) => {
  try {
    const status = req.query.status;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, firstName, lastName, email, phone, address, idType, idNumber, role, status, createdAt, updatedAt 
      FROM users 
      WHERE role = 'member'
    `;
    let queryParams = [];

    if (status) {
      query += ' AND status = ?';
      queryParams.push(status);
    }

    query += ` ORDER BY createdAt DESC LIMIT ${limit} OFFSET ${offset}`;

    const [members] = await pool.execute(query, queryParams);

    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE role = "member"';
    let countParams = [];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const [countResult] = await pool.execute(countQuery, countParams);

    res.json({
      data: members,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(countResult[0].total / limit),
        totalItems: countResult[0].total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ message: 'Error retrieving members' });
  }
});

// @route   PUT /api/admin/members/:id/approve
// @desc    Approve a member
// @access  Private (Admin)
router.put('/members/:id/approve', async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);

    if (isNaN(memberId)) {
      return res.status(400).json({ message: 'Invalid member ID' });
    }

    const [members] = await pool.execute(
      'SELECT id, firstName, lastName, email, status FROM users WHERE id = ? AND role = "member"',
      [memberId]
    );

    if (members.length === 0) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const member = members[0];

    if (member.status === 'approved') {
      return res.status(400).json({ message: 'Member is already approved' });
    }

    const [result] = await pool.execute(
      'UPDATE users SET status = "approved", updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [memberId]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ message: 'Failed to approve member' });
    }

    res.json({ 
      message: `${member.firstName} ${member.lastName} has been approved successfully` 
    });
  } catch (error) {
    console.error('Approve member error:', error);
    res.status(500).json({ message: 'Error approving member' });
  }
});

// @route   DELETE /api/admin/members/:id
// @desc    Delete/Reject a member
// @access  Private (Admin)
router.delete('/members/:id', async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);
    const action = req.query.action || 'delete';

    if (isNaN(memberId)) {
      return res.status(400).json({ message: 'Invalid member ID' });
    }

    const [members] = await pool.execute(
      'SELECT id, firstName, lastName, email FROM users WHERE id = ? AND role = "member"',
      [memberId]
    );

    if (members.length === 0) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const member = members[0];

    if (action === 'reject') {
      await pool.execute(
        'UPDATE users SET status = "rejected", updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [memberId]
      );
      res.json({ 
        message: `${member.firstName} ${member.lastName} has been rejected` 
      });
    } else {
      const [activeChits] = await pool.execute(
        'SELECT COUNT(*) as count FROM chit_members WHERE userId = ? AND status = "active"',
        [memberId]
      );

      if (activeChits[0].count > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete member with active chit participations. Please remove from chit groups first.' 
        });
      }

      await pool.execute('DELETE FROM users WHERE id = ?', [memberId]);
      res.json({ 
        message: `${member.firstName} ${member.lastName} has been deleted successfully` 
      });
    }
  } catch (error) {
    console.error('Delete/Reject member error:', error);
    res.status(500).json({ message: 'Error processing member request' });
  }
});

// @route   GET /api/admin/dashboard-stats
// @desc    Get admin dashboard statistics
// @access  Private (Admin)
router.get('/dashboard-stats', async (req, res) => {
  try {
    const [totalMembers] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE role = "member"'
    );

    const [approvedMembers] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE role = "member" AND status = "approved"'
    );

    const [pendingMembers] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE role = "member" AND status = "pending"'
    );

    const [activeChits] = await pool.execute(
      'SELECT COUNT(*) as count FROM chit_groups WHERE status = "active"'
    );

    const [totalTransactions] = await pool.execute(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = "completed"'
    );

    const [recentMembers] = await pool.execute(`
      SELECT id, firstName, lastName, email, status, createdAt 
      FROM users 
      WHERE role = 'member' 
      ORDER BY createdAt DESC 
      LIMIT 5
    `);

    res.json({
      data: {
        totalMembers: totalMembers[0].count,
        approvedMembers: approvedMembers[0].count,
        pendingMembers: pendingMembers[0].count,
        activeChitGroups: activeChits[0].count,
        totalTransactionsAmount: totalTransactions[0].total,
        recentMembers: recentMembers
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Error retrieving dashboard statistics' });
  }
});
// adminRoutes.js
router.post('/chit-groups', async (req, res) => {
  try {
    const { name, description, amount, durationMonths, membersLimit, status } = req.body;
    const adminId = req.user.id;

    if (!name || !amount || !durationMonths || !membersLimit) {
      return res.status(400).json({ message: "All fields (name, amount, durationMonths, membersLimit) are required." });
    }

    // Example logic: monthly contribution per member
    const monthlyContribution = (amount / membersLimit) / durationMonths;

    const [result] = await pool.execute(
      `INSERT INTO chit_groups 
       (name, description, amount, durationMonths, membersLimit, monthlyContribution, status, createdBy, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [name, description || null, amount, durationMonths, membersLimit, monthlyContribution, status || 'active', adminId]
    );

    res.status(201).json({ message: "Chit group created successfully", id: result.insertId });
  } catch (error) {
    console.error('Chit group creation error:', error);
    res.status(500).json({ message: `Failed to create chit group: ${error.message}` });
  }
});

// @route   GET /api/admin/chit-groups
// @desc    Get all chit groups
// @access  Private (Admin)
router.get('/chit-groups', async (req, res) => {
  try {
    const [chitGroups] = await pool.execute(`
      SELECT 
        cg.*,
        COUNT(cm.id) as currentMembers,
        CONCAT(u.firstName, ' ', u.lastName) as createdByName
      FROM chit_groups cg
      LEFT JOIN chit_members cm ON cg.id = cm.chitGroupId AND cm.status = 'active'
      LEFT JOIN users u ON cg.createdBy = u.id
      GROUP BY cg.id
      ORDER BY cg.createdAt DESC
    `);

    res.json({ data: chitGroups });
  } catch (error) {
    console.error('Get chit groups error:', error);
    res.status(500).json({ message: 'Error retrieving chit groups' });
  }
});

// @route   POST /api/admin/chit-groups
// @desc    Create a new chit group
// @access  Private (Admin)
router.post('/chit-groups', async (req, res) => {
  try {
    const { name, description, amount, durationMonths, membersLimit, status } = req.body;
    const adminId = req.user.id; // From auth middleware

    // Basic validation
    if (!name || !amount || !durationMonths || !membersLimit) {
      return res.status(400).json({ message: "All fields (name, amount, durationMonths, membersLimit) are required." });
    }

    // Insert into DB
    const [result] = await pool.execute(
      'INSERT INTO chit_groups (name, description, amount, duration_months, members_limit, status, createdBy, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [name, description || null, amount, durationMonths, membersLimit, status || 'active', adminId]
    );

    res.status(201).json({ message: "Chit group created successfully", id: result.insertId });
  } catch (error) {
    console.error('Chit group creation error:', error);
    res.status(500).json({ message: `Failed to create chit group: ${error.message}` });
  }
});

// @route   PUT /api/admin/chit-groups/:id
// @desc    Update chit group
// @access  Private (Admin)
router.put('/chit-groups/:id', async (req, res) => {
  try {
    const chitGroupId = parseInt(req.params.id);

    if (isNaN(chitGroupId)) {
      return res.status(400).json({ message: 'Invalid chit group ID' });
    }

    const { name, status } = req.body;

    const [existingGroups] = await pool.execute(
      'SELECT id FROM chit_groups WHERE id = ?',
      [chitGroupId]
    );

    if (existingGroups.length === 0) {
      return res.status(404).json({ message: 'Chit group not found' });
    }

    let updateQuery = 'UPDATE chit_groups SET updatedAt = CURRENT_TIMESTAMP';
    let params = [];

    if (name) {
      updateQuery += ', name = ?';
      params.push(name);
    }

    if (status && ['active', 'completed', 'suspended'].includes(status)) {
      updateQuery += ', status = ?';
      params.push(status);
    }

    updateQuery += ' WHERE id = ?';
    params.push(chitGroupId);

    await pool.execute(updateQuery, params);

    res.json({ message: 'Chit group updated successfully' });
  } catch (error) {
    console.error('Update chit group error:', error);
    res.status(500).json({ message: 'Error updating chit group' });
  }
});

// @route   POST /api/admin/chit-groups/:id/add-member
// @desc    Add member to chit group
// @access  Private (Admin)
router.post('/chit-groups/:id/add-member', async (req, res) => {
  try {
    const chitGroupId = parseInt(req.params.id);
    const { userId } = req.body;

    if (isNaN(chitGroupId) || !userId) {
      return res.status(400).json({ message: 'Invalid chit group ID or user ID' });
    }

    const [chitGroups] = await pool.execute(
      'SELECT totalMembers FROM chit_groups WHERE id = ? AND status = "active"',
      [chitGroupId]
    );

    if (chitGroups.length === 0) {
      return res.status(404).json({ message: 'Chit group not found or not active' });
    }

    const [users] = await pool.execute(
      'SELECT id, firstName, lastName FROM users WHERE id = ? AND role = "member" AND status = "approved"',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found or not approved member' });
    }

    const [existingMember] = await pool.execute(
      'SELECT id FROM chit_members WHERE chitGroupId = ? AND userId = ?',
      [chitGroupId, userId]
    );

    if (existingMember.length > 0) {
      return res.status(400).json({ message: 'Member is already in this chit group' });
    }

    const [currentMembers] = await pool.execute(
      'SELECT COUNT(*) as count FROM chit_members WHERE chitGroupId = ? AND status = "active"',
      [chitGroupId]
    );

    if (currentMembers[0].count >= chitGroups[0].totalMembers) {
      return res.status(400).json({ message: 'Chit group is already full' });
    }

    await pool.execute(
      'INSERT INTO chit_members (chitGroupId, userId) VALUES (?, ?)',
      [chitGroupId, userId]
    );

    res.json({
      message: `${users[0].firstName} ${users[0].lastName} added to chit group successfully`
    });
  } catch (error) {
    console.error('Add member to chit group error:', error);
    res.status(500).json({ message: 'Error adding member to chit group' });
  }
});

// @route   GET /api/admin/transactions
// @desc    Get all transactions
// @access  Private (Admin)
router.get('/transactions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [transactions] = await pool.execute(`
      SELECT 
        t.*,
        CONCAT(u.firstName, ' ', u.lastName) as memberName,
        u.email as memberEmail,
        cg.name as chitGroupName
      FROM transactions t
      JOIN users u ON t.userId = u.id
      JOIN chit_groups cg ON t.chitGroupId = cg.id
      ORDER BY t.createdAt DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM transactions');

    res.json({
      data: transactions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(countResult[0].total / limit),
        totalItems: countResult[0].total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Error retrieving transactions' });
  }
});

module.exports = router;