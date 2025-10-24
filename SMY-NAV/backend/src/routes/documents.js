import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all documents
// @route   GET /api/documents
// @access  Private
router.get('/', protect, async (req, res) => {
  res.json({
    success: true,
    data: { message: 'Get all documents - To be implemented' }
  });
});

// @desc    Upload document
// @route   POST /api/documents
// @access  Private
router.post('/', protect, async (req, res) => {
  res.json({
    success: true,
    data: { message: 'Upload document - To be implemented' }
  });
});

export default router;