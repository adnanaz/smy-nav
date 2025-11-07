import express from 'express';
import { body, validationResult, query } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';

import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { protect, requireRole } from '../middleware/auth.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { 
  getAgencyInvoices, 
  updatePaymentStatus, 
  adminApprovePayment,
  trainingPrices 
} from '../services/invoiceService.js';

const router = express.Router();

// Configure multer for payment proof uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = os.tmpdir();
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/pdf'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for payment proof
  }
});

// @desc    Get agency invoices
// @route   GET /api/invoices
// @access  Private (Agency)
router.get('/', protect, async (req, res, next) => {
  try {
    // Query parameters for filtering
    const { status, paymentStatus, trainingType } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (paymentStatus) filters.paymentStatus = paymentStatus;
    if (trainingType) filters.trainingType = trainingType;

    const invoices = await getAgencyInvoices(req.user.agencyId, filters);

    // Calculate totals
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const pendingAmount = invoices
      .filter(inv => inv.paymentStatus === 'pending')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    const paidAmount = invoices
      .filter(inv => ['paid', 'approved'].includes(inv.paymentStatus))
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    res.json({
      success: true,
      data: {
        invoices,
        summary: {
          totalInvoices: invoices.length,
          totalAmount,
          pendingAmount,
          paidAmount,
          pendingInvoices: invoices.filter(inv => inv.paymentStatus === 'pending').length,
          paidInvoices: invoices.filter(inv => ['paid', 'approved'].includes(inv.paymentStatus)).length
        }
      }
    });

  } catch (error) {
    logger.error('Get agency invoices error:', error);
    next(error);
  }
});

// @desc    Get specific invoice details
// @route   GET /api/invoices/:id
// @access  Private (Agency/Admin)
router.get('/:id', protect, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Base query
    const whereClause = { id };
    
    // If not admin, restrict to agency's invoices only
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      whereClause.agencyId = req.user.agencyId;
    }

    const invoice = await prisma.trainingInvoice.findFirst({
      where: whereClause,
      include: {
        participants: {
          select: {
            id: true,
            fullName: true,
            registrationNumber: true,
            status: true,
            createdAt: true,
            documents: true
          }
        },
        agency: {
          select: {
            id: true,
            name: true,
            code: true,
            email: true,
            phone: true,
            address: true
          }
        },
        approver: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { message: 'Invoice not found' }
      });
    }

    res.json({
      success: true,
      data: { invoice }
    });

  } catch (error) {
    logger.error('Get invoice detail error:', error);
    next(error);
  }
});

// @desc    Upload payment proof
// @route   POST /api/invoices/:id/payment-proof
// @access  Private (Agency)
router.post('/:id/payment-proof', protect, upload.single('paymentProof'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find invoice and ensure it belongs to the agency
    const invoice = await prisma.trainingInvoice.findFirst({
      where: {
        id,
        agencyId: req.user.agencyId
      }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { message: 'Invoice not found' }
      });
    }

    // Check if invoice can receive payment proof
    if (!['pending'].includes(invoice.paymentStatus)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Payment proof can only be uploaded for pending invoices' }
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'Payment proof file is required' }
      });
    }

    try {
      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(
        req.file, 
        `smy-nav/payment-proofs/${invoice.invoiceNumber}`
      );

      if (!uploadResult.success) {
        throw new Error(`Upload failed: ${uploadResult.error}`);
      }

      // Update invoice with payment proof
      const updatedInvoice = await updatePaymentStatus(
        id, 
        uploadResult.url, 
        uploadResult.public_id
      );

      // Clean up temporary file
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temporary file:', cleanupError.message);
      }

      logger.info(`Payment proof uploaded for invoice ${invoice.invoiceNumber}`);

      res.json({
        success: true,
        data: {
          invoice: updatedInvoice,
          message: 'Payment proof uploaded successfully. Awaiting admin approval.'
        }
      });

    } catch (uploadError) {
      // Clean up temporary file on error
      try {
        if (req.file && req.file.path) {
          fs.unlinkSync(req.file.path);
        }
      } catch (cleanupError) {
        console.warn('Failed to cleanup temporary file after error:', cleanupError.message);
      }

      throw uploadError;
    }

  } catch (error) {
    logger.error('Upload payment proof error:', error);
    next(error);
  }
});

// @desc    Get all invoices for admin management
// @route   GET /api/invoices/admin/all
// @access  Private (Admin)
router.get('/admin/all', protect, requireRole(['admin', 'super_admin']), async (req, res, next) => {
  try {
    const { status, paymentStatus, agencyId, trainingProgram, page = 1, limit = 20 } = req.query;
    
    console.log('=== ADMIN INVOICES DEBUG ===');
    console.log('Query params:', req.query);
    console.log('User:', req.user.fullName, req.user.role);
    
    const filters = {};
    if (status) filters.status = status;
    if (paymentStatus) filters.paymentStatus = paymentStatus;
    if (agencyId) filters.agencyId = agencyId;
    if (trainingProgram) filters.trainingProgram = trainingProgram; // Changed from trainingType to trainingProgram

    console.log('Filters applied:', filters);

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // First, let's check total count without filters
    const totalInvoicesInDB = await prisma.trainingInvoice.count();
    console.log('Total invoices in DB:', totalInvoicesInDB);

    // Check some sample data
    if (totalInvoicesInDB > 0) {
      const sampleInvoices = await prisma.trainingInvoice.findMany({
        take: 3,
        select: {
          id: true,
          invoiceNumber: true,
          paymentStatus: true,
          paymentOption: true,
          trainingProgram: true,
          createdAt: true
        }
      });
      console.log('Sample invoices:', sampleInvoices);
    }

    const [invoices, totalCount] = await Promise.all([
      prisma.trainingInvoice.findMany({
        where: filters,
        include: {
          participants: {
            select: {
              id: true,
              fullName: true,
              registrationNumber: true,
              status: true
            }
          },
          agency: {
            select: {
              id: true,
              name: true,
              code: true,
              email: true
            }
          },
          approver: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.trainingInvoice.count({ where: filters })
    ]);

    // Calculate summary
    const allInvoices = await prisma.trainingInvoice.findMany({
      where: filters,
      select: { totalAmount: true, paymentStatus: true }
    });

    const summary = {
      totalInvoices: totalCount,
      totalAmount: allInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      pendingVerification: allInvoices.filter(inv => inv.paymentStatus === 'pending_verification').length,
      pendingApproval: allInvoices.filter(inv => inv.paymentStatus === 'paid').length,
      approved: allInvoices.filter(inv => inv.paymentStatus === 'approved').length,
      rejected: allInvoices.filter(inv => inv.paymentStatus === 'rejected').length,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      currentPage: parseInt(page)
    };

    res.json({
      success: true,
      data: {
        invoices,
        summary,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Get admin invoices error:', error);
    next(error);
  }
});

// @desc    Approve/Reject payment
// @route   PUT /api/invoices/:id/payment-status
// @access  Private (Admin)
router.put('/:id/payment-status', protect, requireRole(['admin', 'super_admin']), [
  body('action')
    .isIn(['approve', 'reject'])
    .withMessage('Action must be either approve or reject'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
], async (req, res, next) => {
  try {
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

    const { id } = req.params;
    const { action, notes = '' } = req.body;

    // Find invoice
    const invoice = await prisma.trainingInvoice.findUnique({
      where: { id }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { message: 'Invoice not found' }
      });
    }

    // Check if invoice has payment proof uploaded
    if (invoice.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        error: { message: 'Can only approve/reject invoices with uploaded payment proof' }
      });
    }

    const updatedInvoice = await adminApprovePayment(id, req.user.id, action, notes);

    logger.info(`Invoice ${invoice.invoiceNumber} payment ${action}d by admin ${req.user.name}`);

    res.json({
      success: true,
      data: {
        invoice: updatedInvoice,
        message: `Payment ${action}d successfully`
      }
    });

  } catch (error) {
    logger.error('Admin payment approval error:', error);
    next(error);
  }
});

// @desc    Get training prices
// @route   GET /api/invoices/training-prices
// @access  Private
router.get('/training-prices', protect, async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: { trainingPrices }
    });
  } catch (error) {
    logger.error('Get training prices error:', error);
    next(error);
  }
});

export default router;