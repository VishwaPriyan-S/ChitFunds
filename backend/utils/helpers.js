// Date utility functions
const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

// Calculate current month and year
const getCurrentMonthYear = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1, // 1-based month
    year: now.getFullYear()
  };
};

// Generate random ID
const generateId = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

// Validate phone number for Indian format
const validateIndianPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

// Calculate chit auction amounts
const calculateAuctionAmount = (totalAmount, bidAmount, commission = 0.05) => {
  const discount = totalAmount - bidAmount;
  const commissionAmount = discount * commission;
  const memberShare = (discount - commissionAmount) / 2; // Remaining shared among members
  const winnerAmount = bidAmount;
  
  return {
    winnerAmount,
    discount,
    commissionAmount,
    memberShare
  };
};

// Pagination helper
const getPaginationInfo = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNext,
    hasPrev
  };
};

// Error response formatter
const formatErrorResponse = (message, code = 'ERROR', details = null) => {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details })
    }
  };
};

// Success response formatter
const formatSuccessResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data
  };
};

// Generate transaction reference
const generateTransactionRef = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `TXN${timestamp}${random}`.toUpperCase();
};

// Mask sensitive information
const maskEmail = (email) => {
  const [name, domain] = email.split('@');
  const maskedName = name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1);
  return `${maskedName}@${domain}`;
};

const maskPhone = (phone) => {
  if (phone.length < 4) return phone;
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
};

// Validate date range
const isValidDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start < end && start >= new Date();
};

module.exports = {
  formatDate,
  addMonths,
  getCurrentMonthYear,
  generateId,
  formatCurrency,
  validateIndianPhone,
  calculateAuctionAmount,
  getPaginationInfo,
  formatErrorResponse,
  formatSuccessResponse,
  generateTransactionRef,
  maskEmail,
  maskPhone,
  isValidDateRange
};