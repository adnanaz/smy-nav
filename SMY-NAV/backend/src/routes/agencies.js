import express from 'express';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all agencies
// @route   GET /api/agencies
// @access  Private (super_admin)
router.get('/', protect, authorize('super_admin'), async (req, res) => {
  res.json({
    success: true,
    data: { message: 'Get all agencies - To be implemented' }
  });
});

// @desc    Create agency
// @route   POST /api/agencies
// @access  Private (super_admin)
router.post('/', protect, authorize('super_admin'), async (req, res) => {
  res.json({
    success: true,
    data: { message: 'Create agency - To be implemented' }
  });
});

export default router;