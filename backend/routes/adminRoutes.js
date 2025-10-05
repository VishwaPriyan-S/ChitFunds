const express = require('express');
const { pool } = require('../config/database');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(verifyToken);
router.use(requireAdmin);

// ==================== MEMBER MANAGEMENT ====================

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

// ==================== CHIT GROUP MANAGEMENT ====================

// @route   GET /api/admin/chit-groups
// @desc    Get all chit groups
// @access  Private (Admin)
router.get('/chit-groups', async (req, res) => {
  try {
    const [chitGroups] = await pool.execute(`
      SELECT 
        cg.*,
        COUNT(DISTINCT cm.id) as currentMembers,
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
    const adminId = req.user.id;

    if (!name || !amount || !durationMonths || !membersLimit) {
      return res.status(400).json({ 
        message: "All fields (name, amount, durationMonths, membersLimit) are required." 
      });
    }

    // Calculate monthly contribution
    const monthlyContribution = Math.round(amount / durationMonths);

    const [result] = await pool.execute(
      `INSERT INTO chit_groups 
       (name, description, amount, durationMonths, membersLimit, monthlyContribution, status, createdBy, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, description || null, amount, durationMonths, membersLimit, monthlyContribution, status || 'active', adminId]
    );

    res.status(201).json({ 
      message: "Chit group created successfully", 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Chit group creation error:', error);
    res.status(500).json({ message: `Failed to create chit group: ${error.message}` });
  }
});

// @route   GET /api/admin/chit-groups/:id
// @desc    Get single chit group details
// @access  Private (Admin)
router.get('/chit-groups/:id', async (req, res) => {
  try {
    const chitGroupId = parseInt(req.params.id);

    if (isNaN(chitGroupId)) {
      return res.status(400).json({ message: 'Invalid chit group ID' });
    }

    const [chitGroups] = await pool.execute(`
      SELECT 
        cg.*,
        COUNT(DISTINCT cm.id) as currentMembers,
        CONCAT(u.firstName, ' ', u.lastName) as createdByName
      FROM chit_groups cg
      LEFT JOIN chit_members cm ON cg.id = cm.chitGroupId AND cm.status = 'active'
      LEFT JOIN users u ON cg.createdBy = u.id
      WHERE cg.id = ?
      GROUP BY cg.id
    `, [chitGroupId]);

    if (chitGroups.length === 0) {
      return res.status(404).json({ message: 'Chit group not found' });
    }

    // Get members in this group
    const [members] = await pool.execute(`
      SELECT 
        cm.*,
        u.firstName,
        u.lastName,
        u.email,
        u.phone
      FROM chit_members cm
      JOIN users u ON cm.userId = u.id
      WHERE cm.chitGroupId = ?
      ORDER BY cm.joinedDate DESC
    `, [chitGroupId]);

    res.json({ 
      data: {
        ...chitGroups[0],
        members
      }
    });
  } catch (error) {
    console.error('Get chit group error:', error);
    res.status(500).json({ message: 'Error retrieving chit group' });
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

    const { name, status, description } = req.body;

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

    if (description !== undefined) {
      updateQuery += ', description = ?';
      params.push(description);
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

// ==================== MEMBER-TO-GROUP ASSIGNMENT ====================

// @route   GET /api/admin/chit-groups/:id/available-members
// @desc    Get members available to add to a chit group
// @access  Private (Admin)
router.get('/chit-groups/:id/available-members', async (req, res) => {
  try {
    const chitGroupId = parseInt(req.params.id);

    if (isNaN(chitGroupId)) {
      return res.status(400).json({ message: 'Invalid chit group ID' });
    }

    // Get approved members who are not already in this group
    const [availableMembers] = await pool.execute(`
      SELECT u.id, u.firstName, u.lastName, u.email, u.phone
      FROM users u
      WHERE u.role = 'member' 
        AND u.status = 'approved'
        AND u.id NOT IN (
          SELECT userId 
          FROM chit_members 
          WHERE chitGroupId = ? AND status = 'active'
        )
      ORDER BY u.firstName, u.lastName
    `, [chitGroupId]);

    res.json({ data: availableMembers });
  } catch (error) {
    console.error('Get available members error:', error);
    res.status(500).json({ message: 'Error retrieving available members' });
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

    // Check if chit group exists and get details
    const [chitGroups] = await pool.execute(
      'SELECT id, membersLimit, name FROM chit_groups WHERE id = ? AND status = "active"',
      [chitGroupId]
    );

    if (chitGroups.length === 0) {
      return res.status(404).json({ message: 'Chit group not found or not active' });
    }

    const chitGroup = chitGroups[0];

    // Check if user exists and is approved
    const [users] = await pool.execute(
      'SELECT id, firstName, lastName FROM users WHERE id = ? AND role = "member" AND status = "approved"',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found or not approved member' });
    }

    const user = users[0];

    // Check if member is already in this group
    const [existingMember] = await pool.execute(
      'SELECT id FROM chit_members WHERE chitGroupId = ? AND userId = ?',
      [chitGroupId, userId]
    );

    if (existingMember.length > 0) {
      return res.status(400).json({ message: 'Member is already in this chit group' });
    }

    // Check if group is full
    const [currentMembers] = await pool.execute(
      'SELECT COUNT(*) as count FROM chit_members WHERE chitGroupId = ? AND status = "active"',
      [chitGroupId]
    );

    if (currentMembers[0].count >= chitGroup.membersLimit) {
      return res.status(400).json({ message: 'Chit group is already full' });
    }

    // Add member to group
    await pool.execute(
      'INSERT INTO chit_members (chitGroupId, userId, status, joinedDate) VALUES (?, ?, "active", NOW())',
      [chitGroupId, userId]
    );

    res.json({
      message: `${user.firstName} ${user.lastName} added to ${chitGroup.name} successfully`
    });
  } catch (error) {
    console.error('Add member to chit group error:', error);
    res.status(500).json({ message: 'Error adding member to chit group' });
  }
});

// @route   DELETE /api/admin/chit-groups/:groupId/members/:memberId
// @desc    Remove member from chit group
// @access  Private (Admin)
router.delete('/chit-groups/:groupId/members/:memberId', async (req, res) => {
  try {
    const chitGroupId = parseInt(req.params.groupId);
    const userId = parseInt(req.params.memberId);

    if (isNaN(chitGroupId) || isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid IDs provided' });
    }

    // Check if member has received chit
    const [member] = await pool.execute(
      'SELECT hasReceived FROM chit_members WHERE chitGroupId = ? AND userId = ?',
      [chitGroupId, userId]
    );

    if (member.length === 0) {
      return res.status(404).json({ message: 'Member not found in this chit group' });
    }

    if (member[0].hasReceived) {
      return res.status(400).json({ 
        message: 'Cannot remove member who has already received chit amount' 
      });
    }

    // Check for pending payments
    const [pendingPayments] = await pool.execute(
      'SELECT COUNT(*) as count FROM transactions WHERE chitGroupId = ? AND userId = ? AND status = "pending"',
      [chitGroupId, userId]
    );

    if (pendingPayments[0].count > 0) {
      return res.status(400).json({ 
        message: 'Cannot remove member with pending payments. Please settle all payments first.' 
      });
    }

    // Remove member
    await pool.execute(
      'UPDATE chit_members SET status = "removed" WHERE chitGroupId = ? AND userId = ?',
      [chitGroupId, userId]
    );

    res.json({ message: 'Member removed from chit group successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Error removing member from chit group' });
  }
});

// ==================== AUCTION MANAGEMENT ====================

// @route   GET /api/admin/auctions
// @desc    Get all auctions
// @access  Private (Admin)
router.get('/auctions', async (req, res) => {
  try {
    const chitGroupId = req.query.chitGroupId;
    const status = req.query.status;

    let query = `
      SELECT 
        a.id,
        a.chitGroupId,
        a.month,
        a.year,
        a.auctionDate,
        a.status,
        a.winnerId,
        a.winningBidAmount,
        a.closedAt,
        a.createdAt,
        cg.name as chitGroupName,
        cg.amount as chitAmount,
        CONCAT(winner.firstName, ' ', winner.lastName) as winnerName,
        COUNT(DISTINCT b.id) as totalBids
      FROM auctions a
      JOIN chit_groups cg ON a.chitGroupId = cg.id
      LEFT JOIN users winner ON a.winnerId = winner.id
      LEFT JOIN bids b ON a.id = b.auctionId 
    `;  // <-- Added space here

    let conditions = [];
    let params = [];

    if (chitGroupId) {
      conditions.push('a.chitGroupId = ?');
      params.push(parseInt(chitGroupId));
    }

    if (status) {
      conditions.push('a.status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY a.id, a.chitGroupId, a.month, a.year, a.auctionDate, a.status, a.winnerId, a.winningBidAmount, a.closedAt, a.createdAt, cg.name, cg.amount, winner.firstName, winner.lastName';
    query += ' ORDER BY a.auctionDate DESC';

    const [auctions] = await pool.execute(query, params);

    res.json({ data: auctions });
  } catch (error) {
    console.error('Get auctions error:', error);
    res.status(500).json({ 
      message: 'Error retrieving auctions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/admin/auctions
// @desc    Create a new auction
// @access  Private (Admin)
router.post('/auctions', async (req, res) => {
  try {
    const { chitGroupId, month, year, auctionDate } = req.body;

    if (!chitGroupId || !month || !year) {
      return res.status(400).json({ message: 'Chit group ID, month, and year are required' });
    }

    // Check if chit group exists
    const [chitGroups] = await pool.execute(
      'SELECT id, amount, status FROM chit_groups WHERE id = ?',
      [chitGroupId]
    );

    if (chitGroups.length === 0) {
      return res.status(404).json({ message: 'Chit group not found' });
    }

    if (chitGroups[0].status !== 'active') {
      return res.status(400).json({ message: 'Chit group is not active' });
    }

    // Check if auction already exists for this month
    const [existingAuction] = await pool.execute(
      'SELECT id FROM auctions WHERE chitGroupId = ? AND month = ? AND year = ?',
      [chitGroupId, month, year]
    );

    if (existingAuction.length > 0) {
      return res.status(400).json({ message: 'Auction already exists for this month' });
    }

    // Create auction
    const [result] = await pool.execute(
      `INSERT INTO auctions (chitGroupId, month, year, auctionDate, status, createdAt) 
       VALUES (?, ?, ?, ?, 'active', NOW())`,
      [chitGroupId, month, year, auctionDate || new Date()]
    );

    res.status(201).json({ 
      message: 'Auction created successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Create auction error:', error);
    res.status(500).json({ message: 'Error creating auction' });
  }
});

// @route   PUT /api/admin/auctions/:id/close
// @desc    Close auction and select winner
// @access  Private (Admin)
router.put('/auctions/:id/close', async (req, res) => {
  try {
    const auctionId = parseInt(req.params.id);
    const { winnerId, winningBidAmount } = req.body;

    if (isNaN(auctionId) || !winnerId || !winningBidAmount) {
      return res.status(400).json({ message: 'Invalid data provided' });
    }

    // Get auction details
    const [auctions] = await pool.execute(
      'SELECT * FROM auctions WHERE id = ?',
      [auctionId]
    );

    if (auctions.length === 0) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    if (auctions[0].status !== 'active') {
      return res.status(400).json({ message: 'Auction is not active' });
    }

    // Verify winner is a member of the chit group
    const [memberCheck] = await pool.execute(
      'SELECT * FROM chit_members WHERE chitGroupId = ? AND userId = ? AND status = "active" AND hasReceived = FALSE',
      [auctions[0].chitGroupId, winnerId]
    );

    if (memberCheck.length === 0) {
      return res.status(400).json({ message: 'Invalid winner - not eligible' });
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update auction
      await connection.execute(
        'UPDATE auctions SET status = "completed", winnerId = ?, winningBidAmount = ?, closedAt = NOW() WHERE id = ?',
        [winnerId, winningBidAmount, auctionId]
      );

      // Update chit member
      await connection.execute(
        'UPDATE chit_members SET hasReceived = TRUE, receivedAmount = ?, receivedMonth = ? WHERE chitGroupId = ? AND userId = ?',
        [winningBidAmount, auctions[0].month, auctions[0].chitGroupId, winnerId]
      );

      // Create payout transaction
     await connection.execute(
  `INSERT INTO transactions (chitGroupId, userId, type, amount, status, month, year, transactionDate, createdAt) 
   VALUES (?, ?, 'payout', ?, 'completed', ?, ?, NOW(), NOW())`,
  [auctions[0].chitGroupId, winnerId, winningBidAmount, auctions[0].month, auctions[0].year]
);

      await connection.commit();
      connection.release();

      res.json({ message: 'Auction closed successfully' });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (error) {
    console.error('Close auction error:', error);
    res.status(500).json({ message: 'Error closing auction' });
  }
});

// @route   GET /api/admin/auctions/:id/bids
// @desc    Get all bids for an auction
// @access  Private (Admin)
router.get('/auctions/:id/bids', async (req, res) => {
  try {
    const auctionId = parseInt(req.params.id);

    if (isNaN(auctionId)) {
      return res.status(400).json({ message: 'Invalid auction ID' });
    }

    const [bids] = await pool.execute(`
      SELECT 
        b.*,
        CONCAT(u.firstName, ' ', u.lastName) as memberName,
        u.email as memberEmail
      FROM bids b
      JOIN users u ON b.userId = u.id
      WHERE b.auctionId = ?
      ORDER BY b.bidAmount DESC, b.bidTime ASC
    `, [auctionId]);

    res.json({ data: bids });
  } catch (error) {
    console.error('Get auction bids error:', error);
    res.status(500).json({ message: 'Error retrieving bids' });
  }
});

// ==================== TRANSACTION & PAYMENT MANAGEMENT ====================

// @route   GET /api/admin/transactions
// @desc    Get all transactions
// @access  Private (Admin)
// @route   GET /api/admin/transactions
router.get('/transactions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const chitGroupId = req.query.chitGroupId;
    const status = req.query.status;

    let query = `
      SELECT 
        t.*,
        CONCAT(u.firstName, ' ', u.lastName) as memberName,
        u.email as memberEmail,
        cg.name as chitGroupName
      FROM transactions t
      JOIN users u ON t.userId = u.id
      JOIN chit_groups cg ON t.chitGroupId = cg.id 
    `;

    let conditions = [];
    let params = [];

    if (chitGroupId) {
      conditions.push('t.chitGroupId = ?');
      params.push(parseInt(chitGroupId));
    }

    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // FIX: Use template literals for LIMIT/OFFSET, not placeholders
    query += ` ORDER BY t.createdAt DESC LIMIT ${limit} OFFSET ${offset}`;

    const [transactions] = await pool.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM transactions t';
    let countParams = [];

    if (chitGroupId) {
      countQuery += ' WHERE t.chitGroupId = ?';
      countParams.push(parseInt(chitGroupId));
    }

    if (status) {
      if (countParams.length > 0) {
        countQuery += ' AND t.status = ?';
      } else {
        countQuery += ' WHERE t.status = ?';
      }
      countParams.push(status);
    }

    const [countResult] = await pool.execute(countQuery, countParams);

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
    console.error('Error message:', error.message);
    res.status(500).json({ 
      message: 'Error retrieving transactions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/admin/transactions
// @desc    Record a manual transaction/payment
// @access  Private (Admin)
router.post('/transactions', async (req, res) => {
  try {
    const { chitGroupId, userId, type, amount, status, description } = req.body;

    if (!chitGroupId || !userId || !type || !amount) {
      return res.status(400).json({ 
        message: 'Chit group ID, user ID, type, and amount are required' 
      });
    }

    // Validate type
    if (!['contribution', 'payout', 'penalty', 'refund'].includes(type)) {
      return res.status(400).json({ message: 'Invalid transaction type' });
    }

    // Insert transaction
   const [result] = await pool.execute(
  `INSERT INTO transactions (chitGroupId, userId, type, amount, status, description, month, year, transactionDate, createdAt) 
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
  [chitGroupId, userId, type, amount, status || 'completed', description || null, 
   req.body.month || null, req.body.year || null]
);

    res.status(201).json({ 
      message: 'Transaction recorded successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Record transaction error:', error);
    res.status(500).json({ message: 'Error recording transaction' });
  }
});

// @route   PUT /api/admin/transactions/:id
// @desc    Update transaction status
// @access  Private (Admin)
router.put('/transactions/:id', async (req, res) => {
  try {
    const transactionId = parseInt(req.params.id);
    const { status } = req.body;

    if (isNaN(transactionId) || !status) {
      return res.status(400).json({ message: 'Invalid transaction ID or status' });
    }

    if (!['pending', 'completed', 'failed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const [result] = await pool.execute(
      'UPDATE transactions SET status = ? WHERE id = ?',
      [status, transactionId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ message: 'Transaction updated successfully' });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'Error updating transaction' });
  }
});

// ==================== DASHBOARD STATISTICS ====================

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

module.exports = router;