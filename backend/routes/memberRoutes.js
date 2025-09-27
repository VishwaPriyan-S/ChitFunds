const express = require('express');
const { pool } = require('../config/database');
const { verifyToken, requireMember, requireApprovedMember } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all member routes
router.use(verifyToken);
router.use(requireMember);

// @route   GET /api/members/profile
// @desc    Get member profile
// @access  Private (Member)
router.get('/profile', async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, firstName, lastName, email, phone, address, idType, idNumber, role, status, createdAt FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({ data: users[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Error retrieving profile' });
  }
});

// @route   PUT /api/members/profile
// @desc    Update member profile
// @access  Private (Member)
router.put('/profile', async (req, res) => {
  try {
    const { firstName, lastName, phone, address } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName) {
      return res.status(400).json({ message: 'First name and last name are required' });
    }

    const [result] = await pool.execute(
      'UPDATE users SET firstName = ?, lastName = ?, phone = ?, address = ? WHERE id = ?',
      [firstName, lastName, phone, address, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Get updated profile
    const [users] = await pool.execute(
      'SELECT id, firstName, lastName, email, phone, address, idType, idNumber, role, status, createdAt FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({ 
      message: 'Profile updated successfully',
      data: users[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// @route   GET /api/members/chit-groups
// @desc    Get member's chit groups
// @access  Private (Approved Member)
router.get('/chit-groups', requireApprovedMember, async (req, res) => {
  try {
    const [chitGroups] = await pool.execute(`
      SELECT 
        cg.*,
        cm.joinedDate,
        cm.status as memberStatus,
        cm.hasReceived,
        cm.receivedAmount,
        cm.receivedMonth
      FROM chit_groups cg
      JOIN chit_members cm ON cg.id = cm.chitGroupId
      WHERE cm.userId = ? AND cm.status = 'active'
      ORDER BY cg.createdAt DESC
    `, [req.user.id]);

    res.json({ data: chitGroups });
  } catch (error) {
    console.error('Get chit groups error:', error);
    res.status(500).json({ message: 'Error retrieving chit groups' });
  }
});

// @route   GET /api/members/transactions
// @desc    Get member's transactions
// @access  Private (Approved Member)
router.get('/transactions', requireApprovedMember, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [transactions] = await pool.execute(`
      SELECT 
        t.*,
        cg.name as chitGroupName
      FROM transactions t
      JOIN chit_groups cg ON t.chitGroupId = cg.id
      WHERE t.userId = ?
      ORDER BY t.createdAt DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, limit, offset]);

    // Get total count
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM transactions WHERE userId = ?',
      [req.user.id]
    );

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

// @route   GET /api/members/dashboard-stats
// @desc    Get member dashboard statistics
// @access  Private (Member)
router.get('/dashboard-stats', async (req, res) => {
  try {
    // Get member's chit groups count
    const [chitGroupsCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM chit_members WHERE userId = ? AND status = "active"',
      [req.user.id]
    );

    // Get total contributed amount
    const [contributionSum] = await pool.execute(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE userId = ? AND type = "contribution" AND status = "completed"',
      [req.user.id]
    );

    // Get total received amount
    const [receivedSum] = await pool.execute(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE userId = ? AND type = "payout" AND status = "completed"',
      [req.user.id]
    );

    // Get pending payments
    const [pendingPayments] = await pool.execute(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE userId = ? AND status = "pending"',
      [req.user.id]
    );

    res.json({
      data: {
        activeChitGroups: chitGroupsCount[0].count,
        totalContributed: contributionSum[0].total,
        totalReceived: receivedSum[0].total,
        pendingPayments: pendingPayments[0].total,
        accountStatus: req.user.status
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Error retrieving dashboard statistics' });
  }
});

// @route   GET /api/members/available-auctions
// @desc    Get available auctions for member
// @access  Private (Approved Member)
router.get('/available-auctions', requireApprovedMember, async (req, res) => {
  try {
    const [auctions] = await pool.execute(`
      SELECT 
        a.*,
        cg.name as chitGroupName,
        cg.totalAmount,
        cg.monthlyContribution
      FROM auctions a
      JOIN chit_groups cg ON a.chitGroupId = cg.id
      JOIN chit_members cm ON cg.id = cm.chitGroupId
      WHERE cm.userId = ? 
        AND cm.status = 'active' 
        AND cm.hasReceived = FALSE
        AND a.status = 'active'
      ORDER BY a.auctionDate ASC
    `, [req.user.id]);

    res.json({ data: auctions });
  } catch (error) {
    console.error('Get available auctions error:', error);
    res.status(500).json({ message: 'Error retrieving available auctions' });
  }
});

// @route   POST /api/members/place-bid
// @desc    Place a bid in an auction
// @access  Private (Approved Member)
router.post('/place-bid', requireApprovedMember, async (req, res) => {
  try {
    const { auctionId, bidAmount } = req.body;

    if (!auctionId || !bidAmount) {
      return res.status(400).json({ message: 'Auction ID and bid amount are required' });
    }

    if (bidAmount <= 0) {
      return res.status(400).json({ message: 'Bid amount must be positive' });
    }

    // Check if auction exists and is active
    const [auctions] = await pool.execute(
      'SELECT * FROM auctions WHERE id = ? AND status = "active"',
      [auctionId]
    );

    if (auctions.length === 0) {
      return res.status(404).json({ message: 'Auction not found or not active' });
    }

    const auction = auctions[0];

    // Check if user is eligible to bid (member of the chit group and hasn't received yet)
    const [memberCheck] = await pool.execute(
      'SELECT * FROM chit_members WHERE chitGroupId = ? AND userId = ? AND status = "active" AND hasReceived = FALSE',
      [auction.chitGroupId, req.user.id]
    );

    if (memberCheck.length === 0) {
      return res.status(403).json({ message: 'You are not eligible to bid in this auction' });
    }

    // Check if bid amount is valid (should be less than or equal to chit amount)
    const [chitGroup] = await pool.execute(
      'SELECT totalAmount FROM chit_groups WHERE id = ?',
      [auction.chitGroupId]
    );

    if (bidAmount > chitGroup[0].totalAmount) {
      return res.status(400).json({ message: 'Bid amount cannot exceed chit total amount' });
    }

    // Check if user has already placed a bid
    const [existingBid] = await pool.execute(
      'SELECT id FROM bids WHERE auctionId = ? AND userId = ?',
      [auctionId, req.user.id]
    );

    if (existingBid.length > 0) {
      // Update existing bid
      await pool.execute(
        'UPDATE bids SET bidAmount = ?, bidTime = CURRENT_TIMESTAMP WHERE id = ?',
        [bidAmount, existingBid[0].id]
      );
    } else {
      // Place new bid
      await pool.execute(
        'INSERT INTO bids (auctionId, userId, bidAmount) VALUES (?, ?, ?)',
        [auctionId, req.user.id, bidAmount]
      );
    }

    res.json({ message: 'Bid placed successfully' });
  } catch (error) {
    console.error('Place bid error:', error);
    res.status(500).json({ message: 'Error placing bid' });
  }
});

// @route   GET /api/members/my-bids
// @desc    Get member's bid history
// @access  Private (Approved Member)
router.get('/my-bids', requireApprovedMember, async (req, res) => {
  try {
    const [bids] = await pool.execute(`
      SELECT 
        b.*,
        a.month,
        a.year,
        a.status as auctionStatus,
        a.winningBidAmount,
        a.winnerId,
        cg.name as chitGroupName
      FROM bids b
      JOIN auctions a ON b.auctionId = a.id
      JOIN chit_groups cg ON a.chitGroupId = cg.id
      WHERE b.userId = ?
      ORDER BY b.bidTime DESC
    `, [req.user.id]);

    res.json({ data: bids });
  } catch (error) {
    console.error('Get my bids error:', error);
    res.status(500).json({ message: 'Error retrieving bid history' });
  }
});

module.exports = router;