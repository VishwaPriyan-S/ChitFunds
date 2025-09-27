const Joi = require('joi');

// User registration validation
const validateUserRegistration = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().min(2).max(50).required().messages({
      'string.empty': 'First name is required',
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name cannot exceed 50 characters'
    }),
    lastName: Joi.string().min(2).max(50).required().messages({
      'string.empty': 'Last name is required',
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name cannot exceed 50 characters'
    }),
    email: Joi.string().email().required().messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address'
    }),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).required().messages({
      'string.empty': 'Phone number is required',
      'string.pattern.base': 'Phone number must be between 10-15 digits'
    }),
    address: Joi.string().allow('').max(500),
    idType: Joi.string().valid('aadhaar', 'pan', 'voter', 'passport').required().messages({
      'any.only': 'ID type must be one of: aadhaar, pan, voter, passport'
    }),
    idNumber: Joi.string().min(3).max(50).required().messages({
      'string.empty': 'ID number is required',
      'string.min': 'ID number must be at least 3 characters',
      'string.max': 'ID number cannot exceed 50 characters'
    }),
    password: Joi.string().min(6).max(100).required().messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters'
    })
  });

  return schema.validate(data);
};

// User login validation
const validateUserLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address'
    }),
    password: Joi.string().required().messages({
      'string.empty': 'Password is required'
    })
  });

  return schema.validate(data);
};

// Admin login validation
const validateAdminLogin = (data) => {
  const schema = Joi.object({
    username: Joi.string().required().messages({
      'string.empty': 'Username is required'
    }),
    password: Joi.string().required().messages({
      'string.empty': 'Password is required'
    })
  });

  return schema.validate(data);
};

// Chit group validation
const validateChitGroup = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(200).required().messages({
      'string.empty': 'Chit group name is required',
      'string.min': 'Name must be at least 3 characters',
      'string.max': 'Name cannot exceed 200 characters'
    }),
    totalAmount: Joi.number().positive().required().messages({
      'number.base': 'Total amount must be a number',
      'number.positive': 'Total amount must be positive'
    }),
    monthlyContribution: Joi.number().positive().required().messages({
      'number.base': 'Monthly contribution must be a number',
      'number.positive': 'Monthly contribution must be positive'
    }),
    duration: Joi.number().integer().min(6).max(60).required().messages({
      'number.base': 'Duration must be a number',
      'number.integer': 'Duration must be a whole number',
      'number.min': 'Duration must be at least 6 months',
      'number.max': 'Duration cannot exceed 60 months'
    }),
    totalMembers: Joi.number().integer().min(5).max(50).required().messages({
      'number.base': 'Total members must be a number',
      'number.integer': 'Total members must be a whole number',
      'number.min': 'Minimum 5 members required',
      'number.max': 'Maximum 50 members allowed'
    }),
    startDate: Joi.date().min('now').required().messages({
      'date.base': 'Start date must be a valid date',
      'date.min': 'Start date cannot be in the past'
    })
  });

  return schema.validate(data);
};

// Email validation utility
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation utility
const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10,15}$/;
  return phoneRegex.test(phone);
};

// ID number validation based on type
const validateIdNumber = (idType, idNumber) => {
  switch (idType) {
    case 'aadhaar':
      return /^[0-9]{12}$/.test(idNumber);
    case 'pan':
      return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(idNumber);
    case 'voter':
      return /^[A-Z]{3}[0-9]{7}$/.test(idNumber);
    case 'passport':
      return /^[A-Z][0-9]{7}$/.test(idNumber);
    default:
      return false;
  }
};

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateAdminLogin,
  validateChitGroup,
  isValidEmail,
  isValidPhone,
  validateIdNumber
};