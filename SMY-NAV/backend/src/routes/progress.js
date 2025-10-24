import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get progress tracking
// @route   GET /api/progress
// @access  Private
router.get('/', protect, async (req, res) => {
  res.json({
    success: true,
    data: { message: 'Get progress tracking - To be implemented' }
  });
});

// @desc    Update progress
// @route   PUT /api/progress/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  res.json({
    success: true,
    data: { message: 'Update progress - To be implemented' }
  });
});

export default router;