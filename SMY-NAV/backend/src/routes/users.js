import express from 'express';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all users
// @route   GET /api/users
// @access  Private (super_admin, admin)
router.get('/', protect, authorize('super_admin', 'admin'), async (req, res) => {
  res.json({
    success: true,
    data: { message: 'Get all users - To be implemented' }
  });
});

// @desc    Create user
// @route   POST /api/users
// @access  Private (super_admin, admin)
router.post('/', protect, authorize('super_admin', 'admin'), async (req, res) => {
  res.json({
    success: true,
    data: { message: 'Create user - To be implemented' }
  });
});

export default router;