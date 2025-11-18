import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

import config from '../config/index.js';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public (but restricted to super_admin only in production)
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 100 })
    .withMessage('Username must be between 3 and 100 characters')
    .isAlphanumeric()
    .withMessage('Username must contain only letters and numbers'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('fullName')
    .isLength({ min: 2, max: 255 })
    .withMessage('Full name must be between 2 and 255 characters'),
  body('role')
    .isIn(['super_admin', 'admin', 'agent'])
    .withMessage('Invalid role'),
  body('agencyId')
    .optional()
    .isUUID()
    .withMessage('Invalid agency ID')
], async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { 
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { username, email, password, fullName, role, agencyId } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: { message: 'User with this email or username already exists' }
      });
    }

    // Validate agency requirement for non-super_admin users
    if (role !== 'super_admin' && !agencyId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Agency ID is required for admin and agent roles' }
      });
    }

    // Verify agency exists if provided
    if (agencyId) {
      const agency = await prisma.agency.findUnique({
        where: { id: agencyId }
      });

      if (!agency) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid agency ID' }
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(config.security.bcryptRounds);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        fullName,
        role,
        agencyId: role === 'super_admin' ? null : agencyId,
      },
      include: {
        agency: true
      }
    });

    logger.info(`New user registered: ${user.email} (${user.role})`);

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          agency: user.agency,
          isActive: user.isActive,
          emailVerified: user.emailVerified
        }
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    next(error);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { 
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        agency: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' }
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: { message: 'Account is deactivated' }
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' }
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          agency: user.agency,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          lastLogin: user.lastLogin
        }
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        agency: true
      }
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          agency: user.agency,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          lastLogin: user.lastLogin
        }
      }
    });

  } catch (error) {
    logger.error('Get current user error:', error);
    next(error);
  }
});

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
router.put('/password', protect, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
], async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { 
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: { message: 'Current password is incorrect' }
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(config.security.bcryptRounds);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newPasswordHash }
    });

    logger.info(`Password updated for user: ${user.email}`);

    res.json({
      success: true,
      data: { message: 'Password updated successfully' }
    });

  } catch (error) {
    logger.error('Update password error:', error);
    next(error);
  }
});

// @desc    Register participant (public endpoint for walk-in users)
// @route   POST /api/auth/register-participant
// @access  Public
router.post('/register-participant', [
  body('fullName')
    .isLength({ min: 3, max: 100 })
    .withMessage('Nama lengkap minimal 3 karakter'),
  body('email')
    .isEmail()
    .withMessage('Format email tidak valid')
    .normalizeEmail(),
  body('phone')
    .matches(/^(\+62|62|0)[0-9]{9,13}$/)
    .withMessage('Format nomor HP tidak valid'),
  body('birthDate')
    .isISO8601()
    .withMessage('Format tanggal lahir tidak valid'),
  body('occupation')
    .isLength({ min: 2 })
    .withMessage('Pekerjaan minimal 2 karakter'),
  body('company')
    .isLength({ min: 2 })
    .withMessage('Nama perusahaan minimal 2 karakter'),
  body('interestedProgram')
    .notEmpty()
    .withMessage('Program pelatihan wajib dipilih'),
  body('source')
    .notEmpty()
    .withMessage('Sumber informasi wajib dipilih'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password minimal 6 karakter')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password harus mengandung huruf besar, huruf kecil, dan angka')
], async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { 
          message: 'Data tidak valid',
          details: errors.array()
        }
      });
    }

    const {
      fullName,
      email,
      phone,
      birthDate,
      occupation,
      company,
      interestedProgram,
      source,
      password
    } = req.body;

    // Validate age (minimum 17 years old)
    const birthDateObj = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDateObj.getFullYear();
    if (age < 17) {
      return res.status(400).json({
        success: false,
        error: { message: 'Minimal berusia 17 tahun' }
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email sudah terdaftar' }
      });
    }

    // Generate username from email (before @)
    const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = baseUsername;
    let counter = 1;

    // Ensure username is unique
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Hash password
    const salt = await bcrypt.genSalt(config.security.bcryptRounds);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user with participant role
    const newUser = await prisma.user.create({
      data: {
        username,
        fullName,
        email,
        passwordHash,
        role: 'participant',
        isActive: true,
        emailVerified: true, // Auto-verify for walk-in users
        // Additional participant data
        phone,
        birthDate: new Date(birthDate),
        occupation,
        company,
        interestedProgram,
        source,
        registrationDate: new Date(),
        registrationType: 'walk-in'
      }
    });

    // Generate JWT token for auto-login
    const token = jwt.sign(
      { 
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    logger.info(`New participant registered: ${newUser.email}`);

    // Remove password from response
    const { passwordHash: _, ...userResponse } = newUser;

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    logger.error('Participant registration error:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: { message: 'Email atau username sudah terdaftar' }
      });
    }

    next(error);
  }
});

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, (req, res) => {
  logger.info(`User logged out: ${req.user.email}`);
  
  res.json({
    success: true,
    data: { message: 'Logged out successfully' }
  });
});

export default router;