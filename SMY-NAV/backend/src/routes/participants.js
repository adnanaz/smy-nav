import express from 'express';
import { body, validationResult, query } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';

import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { protect, requireRole } from '../middleware/auth.js';

// Helper function to calculate progress percentage based on status
const getProgressPercentage = (status) => {
  const progressMap = {
    'draft': 5,
    'submitted': 20,
    'verified': 40,
    'waiting_quota': 60,
    'sent_to_center': 75,
    'waiting_dispatch': 90,
    'completed': 100,
    'rejected': 0
  }
  
  return progressMap[status] || 0
}

// Helper function to get progress step based on status
const getProgressStep = (status) => {
  const stepMap = {
    'draft': 1,
    'submitted': 2,
    'verified': 3,
    'waiting_quota': 4,
    'sent_to_center': 5,
    'waiting_dispatch': 6,
    'completed': 6,
    'rejected': 1
  }
  
  return stepMap[status] || 1
}

// Helper function to create payment history entry
const createPaymentHistoryEntry = (version, status, paymentProof = null, adminNotes = null, actionBy = null) => {
  const entry = {
    version,
    status,
    timestamp: new Date().toISOString()
  }
  
  if (paymentProof) entry.paymentProof = paymentProof
  if (adminNotes) entry.adminNotes = adminNotes
  if (actionBy) entry.actionBy = actionBy
  
  return entry
}

// Helper function to get schedule info for participant
const getScheduleInfo = async (trainingProgram) => {
  try {
    const schedule = await prisma.trainingSchedule.findFirst({
      where: {
        trainingProgram,
        isActive: true,
        startDate: {
          gte: new Date() // Future or current schedules
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    if (!schedule) return null;

    const now = new Date();
    const startDate = new Date(schedule.startDate);
    const diffTime = startDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      ...schedule,
      daysUntilStart: diffDays,
      countdownText: diffDays > 0 ? `H-${diffDays}` : diffDays === 0 ? 'Hari ini' : 'Sudah dimulai'
    };
  } catch (error) {
    console.error('Error getting schedule info:', error);
    return null;
  }
};

import { uploadToStorage, deleteFromStorage } from '../config/storage.js';

const router = express.Router();

// Configure multer for temporary file storage before uploading to storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use system temporary directory
    const tempDir = os.tmpdir();
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename for temporary storage
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allowed file types
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
    fileSize: 3 * 1024 * 1024, // 3MB limit
  }
});

// Training types configuration
const trainingTypes = {
  BST: {
    name: 'BST (Basic Safety Training)',
    description: 'Pelatihan keselamatan dasar untuk pelaut sesuai standar STCW. Mencakup personal survival techniques, fire prevention, elementary first aid, dan personal safety. PSSR akan diperbarui secara resmi dengan modul Kesehatan Mental, yang mencakup pencegahan dan penanganan kekerasan, pelecehan seksual, serta bullying di lingkungan kerja kapal.',
    duration: '10 hari',
    processingTime: '3-4 minggu',
    certificate: 'BST Certificate',
    requiredDocuments: ['ktp', 'ijazah', 'foto', 'surat_sehat', 'passport_optional']
  },
  SAT: {
    name: 'SAT (Security Awareness Training)',
    description: 'Pelatihan kesadaran keamanan kapal untuk awak kapal sesuai ISPS Code. Memberikan pemahaman tentang ancaman keamanan maritim dan prosedur darurat.',
    duration: '1 hari',
    processingTime: '2-3 minggu',
    certificate: 'SAT Certificate',
    requiredDocuments: ['ktp', 'ijazah', 'foto', 'surat_sehat', 'passport_optional', 'sertifikat_bst']
  },
  CCM: {
    name: 'CCM (Crowd & Crisis Management)',
    description: 'Pelatihan manajemen kerumunan dan krisis untuk awak kapal pesiar. Mencakup prosedur evakuasi, komunikasi darurat, manajemen penumpang, koordinasi tim dan pengambilan keputusan dalam situasi darurat. Paket lengkap CMHBT dan CMT.',
    duration: '3 hari',
    processingTime: '2-3 minggu',
    certificate: 'CCM Certificate',
    requiredDocuments: ['ktp', 'ijazah', 'foto', 'surat_sehat', 'passport_optional', 'sertifikat_bst']
  },
  SDSD: {
    name: 'SDSD (Ship Security Duties)',
    description: 'Pelatihan tugas keamanan kapal untuk designated security duties. Meliputi inspeksi keamanan, pengawasan akses, dan implementasi security plan.',
    duration: '2 hari',
    processingTime: '1 bulan',
    certificate: 'SSD Certificate',
    requiredDocuments: ['ktp', 'ijazah', 'foto', 'surat_sehat', 'passport_optional', 'sertifikat_bst']
  },
  PSCRB: {
    name: 'PSCRB',
    description: 'Pelatihan operasi alat penyelamat dan perahu penolong. Mencakup launching, recovery, dan maintenance survival craft serta rescue boat.',
    duration: '2 hari',
    processingTime: '1 bulan',
    certificate: 'PSCRB Certificate',
    requiredDocuments: ['ktp', 'ijazah', 'foto', 'surat_sehat', 'passport_optional', 'sertifikat_bst']
  },
  SB: {
    name: 'SB (Seaman Book)',
    description: 'Pengurusan dokumen buku pelaut sebagai identitas resmi pelaut Indonesia. Diperlukan untuk bekerja di kapal berbendera Indonesia maupun asing.',
    duration: '1 hari processing',
    processingTime: '2 minggu',
    certificate: 'Seaman Book',
    requiredDocuments: ['ktp', 'ijazah', 'foto', 'surat_sehat', 'passport_optional']
  },
  UPDATING_BST: {
    name: 'Updating BST',
    description: 'Penyegaran pelatihan Basic Safety Training untuk perpanjangan sertifikat BST yang sudah expired. Mencakup update materi dan regulasi terbaru.',
    duration: '1 hari',
    processingTime: '2-3 minggu',
    certificate: 'Updated BST Certificate',
    requiredDocuments: ['ktp', 'ijazah', 'foto', 'surat_sehat', 'passport_optional', 'sertifikat_bst']
  }
};

// @desc    Get training types list
// @route   GET /api/participants/training-types
// @access  Private
router.get('/training-types', protect, async (req, res) => {
  try {
    // Send both formats for compatibility
    const typesArray = Object.entries(trainingTypes).map(([key, value]) => ({
      value: key,
      text: value.name,
      description: value.description,
      duration: value.duration,
      processingTime: value.processingTime,
      certificate: value.certificate,
      requiredDocuments: value.requiredDocuments
    }));

    // Also send as object format
    const typesObject = {};
    Object.entries(trainingTypes).forEach(([key, value]) => {
      typesObject[key] = value;
    });

    res.json({
      success: true,
      data: { 
        trainingTypes: typesObject,
        trainingTypesList: typesArray
      }
    });

  } catch (error) {
    logger.error('Get training types error:', error);
    next(error);
  }
});

// @desc    Get all participants for agent's agency
// @route   GET /api/participants
// @access  Private (Agent/Admin)
router.get('/', protect, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('trainingProgram').optional().isIn(Object.keys(trainingTypes)).withMessage('Invalid training type'),
  query('status').optional().isString().withMessage('Status must be a string'),
  query('agencyOnly').optional().isBoolean().withMessage('AgencyOnly must be boolean'),
  query('participantOnly').optional().isBoolean().withMessage('ParticipantOnly must be boolean')
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

    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      trainingProgram,
      status,
      agencyOnly,
      participantOnly
    } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause based on user role
    const where = {};

    // Role-based filtering
    if (req.user.role === 'agent' || agencyOnly === 'true') {
      // Agent hanya melihat data agency mereka sendiri
      where.agencyId = req.user.agencyId;
    } else if (req.user.role === 'participant' || participantOnly === 'true') {
      // Participant hanya melihat data mereka sendiri
      // Cari berdasarkan email user yang login
      where.email = req.user.email;
    } else if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      // Admin melihat semua data, tapi dengan filter status
      if (!status) {
        // Jika tidak ada filter status, admin hanya melihat yang sudah submitted
        where.status = {
          not: 'draft' // Exclude draft status
        };
      }
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { nik: { contains: search, mode: 'insensitive' } },
        { registrationNumber: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (trainingProgram) {
      where.trainingProgram = trainingProgram;
    }

    if (status) {
      // Handle multiple status values separated by comma
      if (status.includes(',')) {
        const statusArray = status.split(',').map(s => s.trim());
        where.status = { in: statusArray };
      } else {
        where.status = status;
      }
    }

    // Get participants with pagination
    const [participants, total] = await Promise.all([
      prisma.participant.findMany({
        where,
        include: {
          agency: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          creator: {
            select: {
              id: true,
              fullName: true,
              username: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.participant.count({ where })
    ]);

    // Add schedule information for participants with status >= submitted
    const participantsWithSchedule = await Promise.all(
      participants.map(async (participant) => {
        let scheduleInfo = null;
        
        // Only include schedule info for participants with status >= submitted
        const submittedStatuses = ['submitted', 'verified', 'waiting_quota', 'sent_to_center', 'waiting_dispatch', 'completed'];
        if (submittedStatuses.includes(participant.status)) {
          scheduleInfo = await getScheduleInfo(participant.trainingProgram);
        }

        return {
          ...participant,
          scheduleInfo
        };
      })
    );

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        participants: participantsWithSchedule,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Get participants error:', error);
    next(error);
  }
});

// @desc    Search participants for schedule assignment
// @route   GET /api/participants/search
// @access  Private (Admin only)
router.get('/search', protect, requireRole(['admin', 'super_admin']), async (req, res, next) => {
  try {
    const { trainingProgram, search = '' } = req.query

    if (!trainingProgram) {
      return res.status(400).json({
        success: false,
        error: 'Training program is required'
      })
    }

    // Build search conditions
    const where = {
      trainingProgram,
      // Only include participants who are not already assigned to an active schedule
      scheduleAssignments: {
        none: {
          schedule: {
            isActive: true,
            startDate: {
              gte: new Date()
            }
          }
        }
      }
    }

    // Add search filter if provided
    if (search.trim()) {
      where.OR = [
        {
          fullName: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          email: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          agency: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    const participants = await prisma.participant.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        agency: true,
        status: true,
        trainingProgram: true
      },
      orderBy: {
        fullName: 'asc'
      },
      take: 50 // Limit results for autocomplete
    })

    res.json({
      success: true,
      data: participants
    })

  } catch (error) {
    logger.error('Search participants error:', error)
    next(error)
  }
})

// @desc    Get single participant
// @route   GET /api/participants/:id
// @access  Private (Agent/Admin)
router.get('/:id', protect, async (req, res, next) => {
  try {
    const { id } = req.params;

    const participant = await prisma.participant.findFirst({
      where: {
        id,
        agencyId: req.user.agencyId // Ensure user can only access their agency's participants
      },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        }
      }
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        error: { message: 'Participant not found' }
      });
    }

    // Add schedule information if participant status >= submitted
    let scheduleInfo = null;
    const submittedStatuses = ['submitted', 'verified', 'waiting_quota', 'sent_to_center', 'waiting_dispatch', 'completed'];
    if (submittedStatuses.includes(participant.status)) {
      scheduleInfo = await getScheduleInfo(participant.trainingProgram);
    }

    res.json({
      success: true,
      data: { 
        participant: {
          ...participant,
          scheduleInfo
        }
      }
    });

  } catch (error) {
    logger.error('Get participant error:', error);
    next(error);
  }
});

// @desc    Create participant
// @route   POST /api/participants
// @access  Private (Agent/Admin)
router.post('/', protect, upload.fields([
  { name: 'ktp', maxCount: 1 },
  { name: 'ijazah', maxCount: 1 },
  { name: 'foto', maxCount: 1 },
  { name: 'surat_sehat', maxCount: 1 },
  { name: 'passport', maxCount: 1 },
  { name: 'sertifikat_bst', maxCount: 1 }
]), [
  body('fullName')
    .isLength({ min: 2, max: 255 })
    .withMessage('Full name must be between 2 and 255 characters'),
  body('nik')
    .isLength({ min: 16, max: 16 })
    .withMessage('NIK must be exactly 16 characters')
    .isNumeric()
    .withMessage('NIK must be numeric'),
  body('trainingProgram')
    .isIn(Object.keys(trainingTypes))
    .withMessage('Invalid training program'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .isMobilePhone('id-ID')
    .withMessage('Please provide a valid Indonesian phone number'),
  body('birthDate')
    .isISO8601()
    .withMessage('Birth date must be a valid date'),
  body('birthPlace')
    .isLength({ min: 2, max: 100 })
    .withMessage('Birth place must be between 2 and 100 characters'),
  body('gender')
    .isIn(['male', 'female'])
    .withMessage('Gender must be either male or female'),
  body('address')
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters')
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

    const {
      fullName,
      nik,
      trainingProgram,
      email,
      phone,
      birthDate,
      birthPlace,
      gender,
      address
    } = req.body;

    // Check if NIK already exists
    const existingParticipant = await prisma.participant.findUnique({
      where: { nik }
    });

    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        error: { message: 'NIK already exists' }
      });
    }

    // Validate required documents based on training type
    const requiredDocs = trainingTypes[trainingProgram].requiredDocuments;
    const uploadedFiles = req.files || {};
    
    for (const docType of requiredDocs) {
      if (docType !== 'passport_optional' && !uploadedFiles[docType.replace('_optional', '')]) {
        return res.status(400).json({
          success: false,
          error: { message: `Required document missing: ${docType}` }
        });
      }
    }

    // Generate registration number with training program-specific auto-increment
    const agencyCode = req.user.agency?.code || 'AGN';
    
    // Generate training program-specific registration number
    const existing = await prisma.participant.findMany({
      where: {
        registrationNumber: { 
          startsWith: `SMY-${agencyCode}-`,
          endsWith: `-${trainingProgram}`
        }
      },
      select: { registrationNumber: true }
    });

    // Find the highest sequence number for this training program
    let maxSeq = 0;
    existing.forEach(r => {
      const rn = r.registrationNumber || '';
      const regex = new RegExp(`^SMY-${agencyCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)-${trainingProgram.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
      const m = rn.match(regex);
      if (m) {
        const seq = parseInt(m[1], 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      }
    });

    const sequenceNumber = maxSeq + 1;
    const registrationNumber = `SMY-${agencyCode}-${sequenceNumber}-${trainingProgram}`;

    // Prepare documents object
    const documents = {};
    Object.keys(uploadedFiles).forEach(fieldname => {
      documents[fieldname] = uploadedFiles[fieldname][0].filename;
    });

    // Create participant
    const participant = await prisma.participant.create({
      data: {
        fullName,
        nik,
        email,
        phone,
        birthDate: new Date(birthDate),
        birthPlace,
        gender,
        address,
        trainingProgram,
        registrationNumber,
        status: 'draft',
        currentProgressStep: getProgressStep('draft'),
        progressPercentage: getProgressPercentage('draft'),
        agencyId: req.user.agencyId,
        createdBy: req.user.id,
        documents
      },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        }
      }
    });

    logger.info(`New participant created: ${participant.fullName} (${participant.registrationNumber})`);

    res.status(201).json({
      success: true,
      data: { participant }
    });

  } catch (error) {
    logger.error('Create participant error:', error);
    next(error);
  }
});

// @desc    Update participant
// @route   PUT /api/participants/:id
// @access  Private (Agent/Admin)
router.put('/:id', protect, upload.fields([
  { name: 'ktp', maxCount: 1 },
  { name: 'ijazah', maxCount: 1 },
  { name: 'foto', maxCount: 1 },
  { name: 'surat_sehat', maxCount: 1 },
  { name: 'passport', maxCount: 1 },
  { name: 'sertifikat_bst', maxCount: 1 },
  { name: 'payment_proof', maxCount: 1 }
]), [
  body('fullName')
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage('Full name must be between 2 and 255 characters'),
  body('nik')
    .optional()
    .isLength({ min: 16, max: 16 })
    .withMessage('NIK must be exactly 16 characters')
    .isNumeric()
    .withMessage('NIK must be numeric'),
  body('trainingProgram')
    .optional()
    .isIn(Object.keys(trainingTypes))
    .withMessage('Invalid training program'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .isMobilePhone('id-ID')
    .withMessage('Please provide a valid Indonesian phone number'),
  body('birthDate')
    .optional()
    .isISO8601()
    .withMessage('Birth date must be a valid date'),
  body('birthPlace')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Birth place must be between 2 and 100 characters'),
  body('gender')
    .optional()
    .isIn(['male', 'female'])
    .withMessage('Gender must be either male or female'),
  body('address')
    .optional()
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters'),
  body('status')
    .optional()
    .isIn(['draft', 'submitted', 'verified', 'waiting_quota', 'sent_to_center', 'waiting_dispatch', 'completed', 'rejected'])
    .withMessage('Invalid status'),
  body('paymentOption')
    .optional()
    .isIn(['pay_now', 'pay_later'])
    .withMessage('Payment option must be either pay_now or pay_later')
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
    const updateData = req.body;

    // Find existing participant with role-based access control
    let participantQuery = { id };
    
    // Apply role-based filtering
    if (req.user.role === 'agent') {
      // Agents can only update participants from their agency
      participantQuery.agencyId = req.user.agencyId;
    } else if (req.user.role === 'participant') {
      // Participants can only update their own data
      participantQuery.createdBy = req.user.id;
    }
    // Admin and super_admin can update any participant (no additional filter)
    
    const existingParticipant = await prisma.participant.findFirst({
      where: participantQuery
    });

    if (!existingParticipant) {
      return res.status(404).json({
        success: false,
        error: { message: 'Participant not found' }
      });
    }

    // Check if NIK already exists (if changing NIK)
    if (updateData.nik && updateData.nik !== existingParticipant.nik) {
      const nikExists = await prisma.participant.findUnique({
        where: { nik: updateData.nik }
      });

      if (nikExists) {
        return res.status(400).json({
          success: false,
          error: { message: 'NIK already exists' }
        });
      }
    }

    // Handle file uploads to Cloudinary
    const uploadedFiles = req.files || {};
    let updatedDocuments = { ...existingParticipant.documents };
    
    if (Object.keys(uploadedFiles).length > 0) {
      const uploadPromises = [];
      
      // Process each uploaded file for Cloudinary upload (excluding payment_proof)
      Object.keys(uploadedFiles).forEach(fieldname => {
        // Skip payment_proof as it's handled separately
        if (fieldname === 'payment_proof') return;
        
        const file = uploadedFiles[fieldname][0];
        uploadPromises.push(
          uploadToStorage(file, `smy-nav/participants/${existingParticipant.registrationNumber}`)
            .then(result => {
              if (result.success) {
                updatedDocuments[fieldname] = {
                  url: result.url,
                  public_id: result.public_id,
                  original_filename: result.original_filename,
                  format: result.format,
                  bytes: result.bytes
                };
              } else {
                throw new Error(`Failed to upload ${fieldname}: ${result.error}`);
              }
              
              // Clean up temporary file
              try {
                fs.unlinkSync(file.path);
              } catch (cleanupError) {
                console.warn('Failed to cleanup temporary file:', cleanupError.message);
              }
            })
        );
      });

      // Wait for all uploads to complete
      try {
        await Promise.all(uploadPromises);
        console.log('All files uploaded to storage successfully');
      } catch (uploadError) {
        console.error('Storage upload failed:', uploadError);
        return res.status(500).json({
          success: false,
          error: { message: `File upload failed: ${uploadError.message}` }
        });
      }
    }

    // Handle payment proof upload if provided (with versioning)
    let updatedPaymentProof = existingParticipant.paymentProof;
    let updatedPaymentHistory = existingParticipant.paymentHistory || [];
    let updatedPaymentVersion = existingParticipant.paymentVersion || 1;
    let updatedPaymentStatus = existingParticipant.paymentStatus;
    
    if (uploadedFiles.payment_proof) {
      const paymentFile = uploadedFiles.payment_proof[0];
    try {
  const paymentUploadResult = await uploadToStorage(paymentFile, `smy-nav/participants/${existingParticipant.registrationNumber}/payment`);
        if (paymentUploadResult.success) {
          // Check if this is a new payment upload for pay_later
          const isPayLaterUpload = existingParticipant.paymentOption === 'pay_later' && !existingParticipant.paymentProof;
          
          // Increment version for reupload (except for first pay_later upload)
          if (!isPayLaterUpload) {
            updatedPaymentVersion = (existingParticipant.paymentVersion || 1) + 1;
          } else {
            updatedPaymentVersion = 1; // First upload for pay_later
          }
          
          // Create new payment proof object
          updatedPaymentProof = {
            url: paymentUploadResult.url,
            public_id: paymentUploadResult.public_id,
            original_filename: paymentUploadResult.original_filename,
            format: paymentUploadResult.format,
            bytes: paymentUploadResult.bytes
          };
          
          // Determine status based on context
          let newStatus = 'pending';
          if (isPayLaterUpload) {
            newStatus = 'pending'; // First upload for pay_later
          } else {
            newStatus = existingParticipant.paymentStatus === 'rejected' ? 'resubmitted' : 'pending';
          }
          
          // Add new entry to payment history
          const newHistoryEntry = createPaymentHistoryEntry(
            updatedPaymentVersion, 
            newStatus,
            updatedPaymentProof,
            null,
            req.user.id
          );
          updatedPaymentHistory = [...updatedPaymentHistory, newHistoryEntry];
          
          // Update payment status
          updatedPaymentStatus = newStatus;
        }
        // Clean up temporary file
        try {
          fs.unlinkSync(paymentFile.path);
        } catch (cleanupError) {
          console.warn('Failed to cleanup payment proof file:', cleanupError.message);
        }
      } catch (uploadError) {
        console.error('Payment proof upload failed:', uploadError);
        return res.status(500).json({
          success: false,
          error: { message: `Payment proof upload failed: ${uploadError.message}` }
        });
      }
    }

    // Convert birthDate if provided
    if (updateData.birthDate) {
      updateData.birthDate = new Date(updateData.birthDate);
    }

    // Convert numeric fields if provided
    if (updateData.currentProgressStep !== undefined) {
      updateData.currentProgressStep = parseInt(updateData.currentProgressStep);
    }
    if (updateData.progressPercentage !== undefined) {
      updateData.progressPercentage = parseFloat(updateData.progressPercentage);
    }

    // Update participant
    const participant = await prisma.participant.update({
      where: { id },
      data: {
        ...updateData,
        documents: updatedDocuments,
        paymentProof: updatedPaymentProof,
        paymentHistory: updatedPaymentHistory,
        paymentVersion: updatedPaymentVersion,
        paymentStatus: updatedPaymentStatus,
        updatedAt: new Date()
      },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        }
      }
    });

    logger.info(`Participant updated: ${participant.fullName} (${participant.registrationNumber})`);

    res.json({
      success: true,
      data: { participant }
    });

  } catch (error) {
    logger.error('Update participant error:', error);
    next(error);
  }
});

// @desc    Delete participant
// @route   DELETE /api/participants/:id
// @access  Private (Agent/Admin)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find existing participant
    const existingParticipant = await prisma.participant.findFirst({
      where: {
        id,
        agencyId: req.user.agencyId
      }
    });

    if (!existingParticipant) {
      return res.status(404).json({
        success: false,
        error: { message: 'Participant not found' }
      });
    }

    // Check if participant can be deleted (only draft status)
    if (existingParticipant.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: { message: 'Only participants with draft status can be deleted' }
      });
    }

    // Delete participant
    await prisma.participant.delete({
      where: { id }
    });

    logger.info(`Participant deleted: ${existingParticipant.fullName} (${existingParticipant.registrationNumber})`);

    res.json({
      success: true,
      data: { message: 'Participant deleted successfully' }
    });

  } catch (error) {
    logger.error('Delete participant error:', error);
    next(error);
  }
});

// @desc    Create participant submission for agency (simplified)
// @route   POST /api/participants/agency-submission
// @access  Private (Agent)
router.post('/agency-submission', protect, upload.fields([
  { name: 'ktp', maxCount: 1 },
  { name: 'ijazah', maxCount: 1 },
  { name: 'foto', maxCount: 1 },
  { name: 'surat_sehat', maxCount: 1 },
  { name: 'passport', maxCount: 1 },
  { name: 'sertifikat_bst', maxCount: 1 },
  { name: 'payment_proof', maxCount: 1 }
]), [
  body('trainingPrograms')
    .custom((value) => {
      try {
        const programs = JSON.parse(value);
        if (!Array.isArray(programs) || programs.length === 0) {
          throw new Error('Training programs must be a non-empty array');
        }
        for (const program of programs) {
          if (!Object.keys(trainingTypes).includes(program)) {
            throw new Error(`Invalid training program: ${program}`);
          }
        }
        return true;
      } catch (error) {
        throw new Error('Invalid training programs format or values');
      }
    }),
  body('hasBSTCertificate')
    .optional()
    .isBoolean()
    .withMessage('hasBSTCertificate must be a boolean value'),
  body('paymentOption')
    .isIn(['pay_now', 'pay_later'])
    .withMessage('Payment option must be either pay_now or pay_later')
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

    // Debug logging for agency submission
    console.log('=== AGENCY SUBMISSION DEBUG ===');
    console.log('Body:', req.body);
    console.log('Files received:', req.files ? Object.keys(req.files) : 'No files');
    console.log('Files detail:', req.files);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Raw request files:', JSON.stringify(req.files, null, 2));

    const trainingPrograms = JSON.parse(req.body.trainingPrograms);
    const hasBSTCertificate = req.body.hasBSTCertificate === 'true';

    // Get all required documents from selected training programs
    const allRequiredDocs = new Set();
    const hasBasicTraining = trainingPrograms.includes('BST') || trainingPrograms.includes('UPDATING_BST');
    
    trainingPrograms.forEach(program => {
      const docs = trainingTypes[program].requiredDocuments;
      docs.forEach(doc => {
        // Skip sertifikat_bst from automatic inclusion - we'll handle it separately
        if (doc !== 'sertifikat_bst') {
          allRequiredDocs.add(doc);
        }
      });
    });

    // Check if BST certificate is needed and confirmed
    const programsNeedingBST = ['SAT', 'CCM', 'SDSD', 'PSCRB', 'UPDATING_BST'];
    const needsBSTCert = trainingPrograms.some(program => programsNeedingBST.includes(program)) && !hasBasicTraining;
    
    if (needsBSTCert) {
      if (!hasBSTCertificate) {
        return res.status(400).json({
          success: false,
          error: { message: 'BST certificate confirmation required for selected training programs' }
        });
      }
      // Add BST certificate to required documents if confirmed
      allRequiredDocs.add('sertifikat_bst');
    }

    // Validate required documents based on combined requirements
    const uploadedFiles = req.files || {};
    const requiredDocsArray = Array.from(allRequiredDocs);
    
    // Debug logging
    console.log('Debug - uploadedFiles:', Object.keys(uploadedFiles));
    console.log('Debug - requiredDocsArray:', requiredDocsArray);
    console.log('Debug - allRequiredDocs:', Array.from(allRequiredDocs));
    
    for (const docType of requiredDocsArray) {
      if (docType !== 'passport_optional' && !uploadedFiles[docType.replace('_optional', '')]) {
        console.log(`Debug - Missing document: ${docType}, looking for field: ${docType.replace('_optional', '')}`);
        return res.status(400).json({
          success: false,
          error: { message: `Required document missing: ${docType}` }
        });
      }
    }

    // Generate registration number with auto-increment for agency bulk
    const agencyCode = req.user.agency?.code || 'AGN';
    
    // Use the first training program for registration number format
    const primaryTrainingProgram = trainingPrograms[0];
    
    // Generate training program-specific registration number
    const existing = await prisma.participant.findMany({
      where: {
        registrationNumber: { 
          startsWith: `SMY-${agencyCode}-`,
          endsWith: `-${primaryTrainingProgram}`
        }
      },
      select: { registrationNumber: true }
    });

    // Find the highest sequence number for this training program
    let maxSeq = 0;
    existing.forEach(r => {
      const rn = r.registrationNumber || '';
      const regex = new RegExp(`^SMY-${agencyCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)-${primaryTrainingProgram.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
      const m = rn.match(regex);
      if (m) {
        const seq = parseInt(m[1], 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      }
    });

    const sequenceNumber = maxSeq + 1;
    const registrationNumber = `SMY-${agencyCode}-${sequenceNumber}-${primaryTrainingProgram}`;

    // Upload files to Cloudinary and prepare documents object
    const documents = {};
    const uploadPromises = [];
    
    // Process each uploaded file for Cloudinary upload (excluding payment_proof)
    Object.keys(uploadedFiles).forEach(fieldname => {
      // Skip payment_proof as it's handled separately
      if (fieldname === 'payment_proof') return;
      
      const file = uploadedFiles[fieldname][0];
    uploadPromises.push(
  uploadToStorage(file, `smy-nav/participants/${registrationNumber}`)
      .then(result => {
            if (result.success) {
              documents[fieldname] = {
                url: result.url,
                public_id: result.public_id,
                original_filename: result.original_filename,
                format: result.format,
                bytes: result.bytes
              };
            } else {
              throw new Error(`Failed to upload ${fieldname}: ${result.error}`);
            }
            
            // Clean up temporary file
            try {
              fs.unlinkSync(file.path);
            } catch (cleanupError) {
              console.warn('Failed to cleanup temporary file:', cleanupError.message);
            }
          })
      );
    });

    // Wait for all uploads to complete
    try {
      await Promise.all(uploadPromises);
      console.log('All files uploaded to storage successfully');
    } catch (uploadError) {
      console.error('Storage upload failed:', uploadError);
      return res.status(500).json({
        success: false,
        error: { message: `File upload failed: ${uploadError.message}` }
      });
    }

    // Extract data from request
    const fullName = req.body.fullName || 'Peserta Baru';
    const paymentOption = req.body.paymentOption; // pay_now or pay_later
    
    // Debug payment info
    console.log('=== PAYMENT DEBUG ===');
    console.log('paymentOption:', paymentOption);
    console.log('payment_proof in files:', uploadedFiles.payment_proof ? 'YES' : 'NO');
    console.log('payment_proof details:', uploadedFiles.payment_proof);
    
    // Handle payment proof if pay_now is selected (shared across all training programs)
    let paymentProof = null;
    if (paymentOption === 'pay_now' && uploadedFiles.payment_proof) {
      // Upload payment proof to Cloudinary with base registration number
      const paymentFile = uploadedFiles.payment_proof[0];
    try {
  const paymentUploadResult = await uploadToStorage(paymentFile, `smy-nav/participants/${registrationNumber}/payment`);
        if (paymentUploadResult.success) {
          paymentProof = {
            url: paymentUploadResult.url,
            public_id: paymentUploadResult.public_id,
            original_filename: paymentUploadResult.original_filename,
            format: paymentUploadResult.format,
            bytes: paymentUploadResult.bytes
          };
        }
        // Clean up temporary file
        try {
          fs.unlinkSync(paymentFile.path);
        } catch (cleanupError) {
          console.warn('Failed to cleanup payment proof file:', cleanupError.message);
        }
      } catch (uploadError) {
        console.error('Payment proof upload failed:', uploadError);
        return res.status(500).json({
          success: false,
          error: { message: `Payment proof upload failed: ${uploadError.message}` }
        });
      }
    }
    
    // Validate payment proof requirement
    if (paymentOption === 'pay_now' && !paymentProof) {
      return res.status(400).json({
        success: false,
        error: { message: 'Payment proof is required when selecting pay now option' }
      });
    }
    
    // Create participant submissions for each training program
    const participants = [];
    
    for (let i = 0; i < trainingPrograms.length; i++) {
      const trainingProgram = trainingPrograms[i];
      
      // Generate unique registration number for each training program
      let uniqueRegistrationNumber;
      if (i === 0) {
        uniqueRegistrationNumber = registrationNumber;
      } else {
        // For additional training programs, generate new registration numbers
        const existing = await prisma.participant.findMany({
          where: {
            registrationNumber: { 
              startsWith: `SMY-${agencyCode}-`,
              endsWith: `-${trainingProgram}`
            }
          },
          select: { registrationNumber: true }
        });

        let maxSeq = 0;
        existing.forEach(r => {
          const rn = r.registrationNumber || '';
          const regex = new RegExp(`^SMY-${agencyCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)-${trainingProgram.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
          const m = rn.match(regex);
          if (m) {
            const seq = parseInt(m[1], 10);
            if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
          }
        });

        const sequenceNumber = maxSeq + 1;
        uniqueRegistrationNumber = `SMY-${agencyCode}-${sequenceNumber}-${trainingProgram}`;
      }
      
      const participantData = {
        fullName: `${fullName} (${trainingProgram})`, // Use actual name from form
        nik: null, // Will be filled later when admin/user complete the data
        trainingProgram,
        registrationNumber: uniqueRegistrationNumber,
        status: 'draft', // Changed to draft - agency needs to submit manually
        currentProgressStep: getProgressStep('draft'),
        progressPercentage: getProgressPercentage('draft'),
        // Personal data will be filled later by admin or user - keep as null for clean display
        birthDate: null,
        birthPlace: null,
        gender: null,
        address: null,
        email: null,
        phone: null,
        // Documents stored as JSON in the participant record
        documents: documents,
        // Payment information
        paymentOption: paymentOption,
        paymentProof: paymentProof,
        paymentVersion: 1,
        paymentHistory: paymentProof ? [createPaymentHistoryEntry(1, 'pending', paymentProof, null, req.user.id)] : [],
        // Use correct field names from schema
        agencyId: req.user.agencyId,
        createdBy: req.user.id  // Changed from createdById to createdBy to match schema
      };

      try {
        const participant = await prisma.participant.create({
          data: participantData
        });

        participants.push({
          id: participant.id,
          registrationNumber: participant.registrationNumber,
          trainingProgram: participant.trainingProgram,
          status: participant.status,
          documents: documents, // Include uploaded documents info
          createdAt: participant.createdAt,
          agency: {
            id: req.user.agency.id,
            name: req.user.agency.name,
            code: req.user.agency.code
          }
        });
      } catch (createError) {
        console.error(`Failed to create participant for ${trainingProgram}:`, createError);
        throw createError; // Re-throw to be caught by outer catch
      }
    }

    logger.info(`New agency submission created: ${registrationNumber} for ${trainingPrograms.length} training programs: ${trainingPrograms.join(', ')}`);

    res.status(201).json({
      success: true,
      data: { 
        participants,
        summary: {
          registrationNumber,
          trainingPrograms,
          totalPrograms: trainingPrograms.length,
          documentsUploaded: Object.keys(documents)
        }
      }
    });

  } catch (error) {
    logger.error('Create agency submission error:', error);
    next(error);
  }
});

// @desc    Submit participant (change status from draft to submitted)
// @route   PUT /api/participants/:id/submit
// @access  Private (Agent)
router.put('/:id/submit', protect, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find participant with role-based access control
    let participantQuery = { id };
    
    // Apply role-based filtering
    if (req.user.role === 'agent') {
      // Agents can only submit participants from their agency
      participantQuery.agencyId = req.user.agencyId;
    } else if (req.user.role === 'participant') {
      // Participants can submit their own data
      participantQuery.createdBy = req.user.id;
    }
    // Admin and super_admin can submit any participant (no additional filter)
    
    const participant = await prisma.participant.findFirst({
      where: participantQuery
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        error: { message: 'Participant not found' }
      });
    }

    // Check if participant is in draft status
    if (participant.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: { message: 'Only participants with draft status can be submitted' }
      });
    }

    // Update participant status to submitted
    const updatedParticipant = await prisma.participant.update({
      where: { id },
      data: {
        status: 'submitted',
        submittedAt: new Date(),
        progressPercentage: getProgressPercentage('submitted'),
        currentProgressStep: getProgressStep('submitted'),
        updatedAt: new Date()
      }
    });

    logger.info(`Participant submitted: ${participant.fullName} (${participant.registrationNumber})`);

    res.json({
      success: true,
      data: { 
        participant: updatedParticipant,
        message: 'Participant successfully submitted for review'
      }
    });

  } catch (error) {
    logger.error('Submit participant error:', error);
    next(error);
  }
});

// @desc    Create participant self-registration (multiple training programs)
// @route   POST /api/participants/self-register
// @access  Private (Participant)
router.post('/self-register', protect, requireRole(['participant']), upload.fields([
  { name: 'ktp', maxCount: 1 },
  { name: 'ijazah', maxCount: 1 },
  { name: 'foto', maxCount: 1 },
  { name: 'surat_sehat', maxCount: 1 },
  { name: 'passport', maxCount: 1 },
  { name: 'sertifikat_bst', maxCount: 1 },
  { name: 'payment_proof', maxCount: 1 }
]), [
  body('fullName')
    .isLength({ min: 2, max: 255 })
    .withMessage('Full name must be between 2 and 255 characters'),
  body('nik')
    .isLength({ min: 16, max: 16 })
    .withMessage('NIK must be exactly 16 characters')
    .isNumeric()
    .withMessage('NIK must be numeric'),
  body('trainingPrograms')
    .custom((value) => {
      try {
        const programs = JSON.parse(value);
        if (!Array.isArray(programs) || programs.length === 0) {
          throw new Error('Training programs must be a non-empty array');
        }
        for (const program of programs) {
          if (!Object.keys(trainingTypes).includes(program)) {
            throw new Error(`Invalid training program: ${program}`);
          }
        }
        return true;
      } catch (error) {
        throw new Error('Invalid training programs format or values');
      }
    }),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .isMobilePhone('id-ID')
    .withMessage('Please provide a valid Indonesian phone number'),
  body('birthDate')
    .isISO8601()
    .withMessage('Birth date must be a valid date'),
  body('birthPlace')
    .isLength({ min: 2, max: 100 })
    .withMessage('Birth place must be between 2 and 100 characters'),
  body('gender')
    .isIn(['male', 'female'])
    .withMessage('Gender must be either male or female'),
  body('address')
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters'),
  body('hasBSTCertificate')
    .optional()
    .isBoolean()
    .withMessage('hasBSTCertificate must be a boolean value')
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

    const {
      fullName,
      nik,
      email,
      phone,
      birthDate,
      birthPlace,
      gender,
      address,
      registrationDate,
      motherName,
      nationality,
      province,
      city,
      district,
      village,
      rtRw,
      postalCode,
      hasBSTCertificate,
      agreeToTerms,
      dataProcessingConsent
    } = req.body;

    const trainingPrograms = JSON.parse(req.body.trainingPrograms);

    // Debug logging for self-registration
    console.log('=== SELF-REGISTRATION DEBUG ===');
    console.log('Body:', req.body);
    console.log('Files received:', req.files ? Object.keys(req.files) : 'No files');
    console.log('Files detail:', req.files);
    console.log('Training programs:', trainingPrograms);

    // Check if NIK already exists
    const existingParticipant = await prisma.participant.findUnique({
      where: { nik }
    });

    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        error: { message: 'NIK already exists' }
      });
    }

    // Get all required documents from selected training programs
    const allRequiredDocs = new Set();
    const hasBasicTraining = trainingPrograms.includes('BST') || trainingPrograms.includes('UPDATING_BST');
    
    trainingPrograms.forEach(program => {
      const docs = trainingTypes[program].requiredDocuments;
      docs.forEach(doc => {
        // Skip optional documents and BST certificate (handled separately)
        if (doc !== 'sertifikat_bst' && !doc.endsWith('_optional')) {
          allRequiredDocs.add(doc);
        }
      });
    });

    // Check if BST certificate is needed and confirmed
    const programsNeedingBST = ['SAT', 'CCM', 'SDSD', 'PSCRB', 'UPDATING_BST'];
    const needsBSTCert = trainingPrograms.some(program => programsNeedingBST.includes(program)) && !hasBasicTraining;
    
    if (needsBSTCert && !hasBSTCertificate) {
      return res.status(400).json({
        success: false,
        error: { message: 'BST certificate confirmation required for selected training programs' }
      });
    }

    if (hasBSTCertificate && needsBSTCert) {
      allRequiredDocs.add('sertifikat_bst');
    }

    // Add payment proof as required document for self-registration
    allRequiredDocs.add('payment_proof');

    // Validate required documents
    const uploadedFiles = req.files || {};
    const requiredDocsArray = Array.from(allRequiredDocs);
    
    console.log('Required documents:', requiredDocsArray);
    console.log('Uploaded files keys:', Object.keys(uploadedFiles));
    console.log('Uploaded files structure:', JSON.stringify(uploadedFiles, null, 2));
    
    for (const docType of requiredDocsArray) {
      // Skip optional documents and handle them separately
      if (docType !== 'passport_optional' && !uploadedFiles[docType.replace('_optional', '')]) {
        console.log(`Missing document: ${docType}, looking for field: ${docType.replace('_optional', '')}`);
        return res.status(400).json({
          success: false,
          error: { message: `Required document missing: ${docType}` }
        });
      }
    }

    // Get or create default agency for participants
    let participantAgency = await prisma.agency.findFirst({
      where: { code: 'SELF' }
    });

    if (!participantAgency) {
      participantAgency = await prisma.agency.create({
        data: {
          name: 'Self Registration',
          code: 'SELF',
          email: 'self@smy-maritime.com',
          phone: '021-000-0000',
          address: 'Self Registration Agency',
          status: 'active'
        }
      });
    }

    // Generate unique registration number for participant with auto-increment per training program
    const primaryTrainingProgram = trainingPrograms[0];
    const prefix = 'SMY-SELF-';
    let baseRegistrationNumber;
    let attempt = 0;
    const maxAttempts = 8;

    while (attempt < maxAttempts) {
      // Fetch existing registration numbers for the specific training program
      const existing = await prisma.participant.findMany({
        where: {
          registrationNumber: { 
            startsWith: prefix,
            endsWith: `-${primaryTrainingProgram}`
          }
        },
        select: { registrationNumber: true }
      });

      // Determine the max numeric sequence for this training program
      let maxSeq = 0;
      existing.forEach(r => {
        const rn = r.registrationNumber || '';
        // Pattern: SMY-SELF-{number}-{trainingProgram}
        const regex = new RegExp(`^SMY-SELF-(\\d+)-${primaryTrainingProgram.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
        const m = rn.match(regex);
        if (m) {
          const seq = parseInt(m[1], 10);
          if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
        }
      });

      const sequenceNumber = maxSeq + 1 + attempt; // add attempt to avoid retry collisions
      baseRegistrationNumber = `SMY-SELF-${sequenceNumber}-${primaryTrainingProgram}`;

      // Quick existence check to avoid attempting with an already-used registrationNumber
      const existsSame = await prisma.participant.findFirst({
        where: { registrationNumber: baseRegistrationNumber }
      });
      if (!existsSame) break;

      // If exists, increment attempt and retry
      attempt++;
      await new Promise(resolve => setTimeout(resolve, 20 + attempt * 10));
    }

    if (!baseRegistrationNumber) {
      return res.status(500).json({ success: false, error: { message: 'Failed to generate unique registration number' } });
    }

    // Upload documents to Cloudinary
    const documents = {};
    const uploadPromises = [];

    Object.keys(uploadedFiles).forEach(fieldname => {
      if (uploadedFiles[fieldname] && uploadedFiles[fieldname][0]) {
        const file = uploadedFiles[fieldname][0];
        uploadPromises.push(
          uploadToStorage(file, `smy-nav/participants/${baseRegistrationNumber}`)
            .then(result => {
              if (result.success) {
                // Store document details like agency submission
                documents[fieldname] = {
                  url: result.url,
                  public_id: result.public_id,
                  original_filename: result.original_filename,
                  format: result.format,
                  bytes: result.bytes
                };
              } else {
                throw new Error(`Failed to upload ${fieldname}: ${result.error}`);
              }
              
              // Clean up temporary file
              try {
                fs.unlinkSync(file.path);
              } catch (cleanupError) {
                console.warn('Failed to cleanup temporary file:', cleanupError.message);
              }
            })
            .catch(error => {
              console.error(`Storage upload error for ${fieldname}:`, error);
              throw new Error(`Failed to upload ${fieldname}: ${error.message}`);
            })
        );
      }
    });

    await Promise.all(uploadPromises);

    // Create participant entries for each training program
    const createdParticipants = [];

    for (let i = 0; i < trainingPrograms.length; i++) {
      const trainingProgram = trainingPrograms[i];
      
      // Generate unique registration number for each training program
      let participantRegistrationNumber;
      if (i === 0) {
        participantRegistrationNumber = baseRegistrationNumber;
      } else {
        // For additional training programs, generate new registration numbers
        const existing = await prisma.participant.findMany({
          where: {
            registrationNumber: { 
              startsWith: 'SMY-SELF-',
              endsWith: `-${trainingProgram}`
            }
          },
          select: { registrationNumber: true }
        });

        let maxSeq = 0;
        existing.forEach(r => {
          const rn = r.registrationNumber || '';
          const regex = new RegExp(`^SMY-SELF-(\\d+)-${trainingProgram.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
          const m = rn.match(regex);
          if (m) {
            const seq = parseInt(m[1], 10);
            if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
          }
        });

        const sequenceNumber = maxSeq + 1;
        participantRegistrationNumber = `SMY-SELF-${sequenceNumber}-${trainingProgram}`;
      }

      const participant = await prisma.participant.create({
        data: {
          fullName,
          nik: i === 0 ? nik : null, // Only first participant gets the NIK to avoid conflicts
          email,
          phone,
          birthDate: new Date(birthDate),
          birthPlace,
          gender,
          address,
          trainingProgram,
          registrationNumber: participantRegistrationNumber,
          status: 'draft', // Self-registration starts as draft, same as agency
          currentProgressStep: getProgressStep('draft'),
          progressPercentage: getProgressPercentage('draft'),
          paymentOption: 'pay_now', // Force pay_now for self-registration
          paymentProof: documents['payment_proof'] ? {
            url: documents['payment_proof'].url,
            public_id: documents['payment_proof'].public_id,
            original_filename: documents['payment_proof'].original_filename,
            format: documents['payment_proof'].format,
            bytes: documents['payment_proof'].bytes
          } : null,
          agencyId: participantAgency.id, // Use default agency for self-registration
          createdBy: req.user.id,
          documents,
          notes: null, // Notes kosong untuk self-registration, hanya diisi oleh admin jika ada catatan
        }
      });

      createdParticipants.push(participant);
    }

    logger.info(`New self-registration created: ${baseRegistrationNumber} for ${trainingPrograms.length} training programs: ${trainingPrograms.join(', ')}`);

    res.status(201).json({
      success: true,
      data: { 
        participants: createdParticipants,
        registrationNumber: baseRegistrationNumber,
        trainingPrograms,
        totalPrograms: trainingPrograms.length,
        message: 'Self-registration successful'
      }
    });

  } catch (error) {
    logger.error('Self-registration error:', error);
    next(error);
  }
});

// @desc    Verify participant (Admin only)
// @route   POST /api/participants/:id/verify
// @access  Private (Admin)
router.post('/:id/verify', protect, requireRole(['admin', 'super_admin']), async (req, res, next) => {
  try {
    const participantId = req.params.id

    // Find participant
    const participant = await prisma.participant.findUnique({
      where: { id: participantId }
    })

    if (!participant) {
      return res.status(404).json({
        success: false,
        error: { message: 'Participant not found' }
      })
    }

    if (participant.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        error: { message: 'Only submitted participants can be verified' }
      })
    }

    // Update participant status
    const updatedParticipant = await prisma.participant.update({
      where: { id: participantId },
      data: {
        status: 'verified',
        currentProgressStep: getProgressStep('verified'),
        progressPercentage: getProgressPercentage('verified')
      },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        }
      }
    })

    res.json({
      success: true,
      data: updatedParticipant,
      message: 'Participant successfully verified'
    })

  } catch (error) {
    logger.error('Verify participant error:', error)
    next(error)
  }
})

// @desc    Reject participant (Admin only)
// @route   POST /api/participants/:id/reject
// @access  Private (Admin)
router.post('/:id/reject', protect, requireRole(['admin', 'super_admin']), async (req, res, next) => {
  try {
    const participantId = req.params.id
    const { reason } = req.body

    // Find participant
    const participant = await prisma.participant.findUnique({
      where: { id: participantId }
    })

    if (!participant) {
      return res.status(404).json({
        success: false,
        error: { message: 'Participant not found' }
      })
    }

    if (participant.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        error: { message: 'Only submitted participants can be rejected' }
      })
    }

    // Update participant status back to draft
    const updatedParticipant = await prisma.participant.update({
      where: { id: participantId },
      data: {
        status: 'rejected',
        currentProgressStep: getProgressStep('rejected'),
        progressPercentage: getProgressPercentage('rejected'),
        notes: reason ? `Ditolak: ${reason}` : 'Ditolak oleh admin'
      },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        }
      }
    })

    res.json({
      success: true,
      data: updatedParticipant,
      message: 'Participant rejected and returned to draft'
    })

  } catch (error) {
    logger.error('Reject participant error:', error)
    next(error)
  }
})

// @desc    Assign participant to batch (Admin only)
// @route   POST /api/participants/:id/assign-batch
// @access  Private (Admin)
router.post('/:id/assign-batch', protect, requireRole(['admin', 'super_admin']), async (req, res, next) => {
  try {
    const participantId = req.params.id

    // Find participant
    const participant = await prisma.participant.findUnique({
      where: { id: participantId }
    })

    if (!participant) {
      return res.status(404).json({
        success: false,
        error: { message: 'Participant not found' }
      })
    }

    if (participant.status !== 'verified') {
      return res.status(400).json({
        success: false,
        error: { message: 'Only verified participants can be assigned to batch' }
      })
    }

    // For now, just update status to waiting_quota
    // Later we'll implement actual batch assignment logic
    const updatedParticipant = await prisma.participant.update({
      where: { id: participantId },
      data: {
        status: 'waiting_quota',
        currentProgressStep: getProgressStep('waiting_quota'),
        progressPercentage: getProgressPercentage('waiting_quota')
      },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        }
      }
    })

    res.json({
      success: true,
      data: updatedParticipant,
      message: 'Participant assigned to batch and waiting for quota'
    })

  } catch (error) {
    logger.error('Assign batch error:', error)
    next(error)
  }
})

// @desc    Confirm dispatch (Admin only)
// @route   POST /api/participants/:id/confirm-dispatch
// @access  Private (Admin)
router.post('/:id/confirm-dispatch', protect, requireRole(['admin', 'super_admin']), async (req, res, next) => {
  try {
    const participantId = req.params.id

    // Find participant
    const participant = await prisma.participant.findUnique({
      where: { id: participantId }
    })

    if (!participant) {
      return res.status(404).json({
        success: false,
        error: { message: 'Participant not found' }
      })
    }

    if (participant.status !== 'sent_to_center') {
      return res.status(400).json({
        success: false,
        error: { message: 'Only participants sent to center can have dispatch confirmed' }
      })
    }

    // Update participant status
    const updatedParticipant = await prisma.participant.update({
      where: { id: participantId },
      data: {
        status: 'waiting_dispatch',
        currentProgressStep: getProgressStep('waiting_dispatch'),
        progressPercentage: getProgressPercentage('waiting_dispatch')
      },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        }
      }
    })

    res.json({
      success: true,
      data: updatedParticipant,
      message: 'Dispatch confirmed successfully'
    })

  } catch (error) {
    logger.error('Confirm dispatch error:', error)
    next(error)
  }
})

// @desc    Complete participant (Admin only)
// @route   POST /api/participants/:id/complete
// @access  Private (Admin)
router.post('/:id/complete', protect, requireRole(['admin', 'super_admin']), async (req, res, next) => {
  try {
    const participantId = req.params.id

    // Find participant
    const participant = await prisma.participant.findUnique({
      where: { id: participantId }
    })

    if (!participant) {
      return res.status(404).json({
        success: false,
        error: { message: 'Participant not found' }
      })
    }

    if (participant.status !== 'waiting_dispatch') {
      return res.status(400).json({
        success: false,
        error: { message: 'Only participants waiting for dispatch can be completed' }
      })
    }

    // Update participant status
    const updatedParticipant = await prisma.participant.update({
      where: { id: participantId },
      data: {
        status: 'completed',
        currentProgressStep: getProgressStep('completed'),
        progressPercentage: getProgressPercentage('completed'),
        completedAt: new Date()
      },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        }
      }
    })

    res.json({
      success: true,
      data: updatedParticipant,
      message: 'Participant process completed successfully'
    })

  } catch (error) {
    logger.error('Complete participant error:', error)
    next(error)
  }
})

// Payment Management Endpoints

// Approve payment
router.put('/:id/payment/approve', protect, async (req, res, next) => {
  try {
    const participantId = req.params.id // Keep as string for UUID
    const { adminNotes } = req.body

    // Check if participant exists
    const existingParticipant = await prisma.participant.findUnique({
      where: { id: participantId }
    })

    if (!existingParticipant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      })
    }

    // Add approval entry to payment history
    const currentHistory = existingParticipant.paymentHistory || [];
    const approvalEntry = createPaymentHistoryEntry(
      existingParticipant.paymentVersion || 1,
      'approved',
      null,
      adminNotes,
      req.user.id
    );
    const updatedPaymentHistory = [...currentHistory, approvalEntry];

    // Update payment status
    const updatedParticipant = await prisma.participant.update({
      where: { id: participantId },
      data: {
        paymentStatus: 'approved',
        paymentHistory: updatedPaymentHistory,
        adminNotes: adminNotes || null,
        paymentApprovedAt: new Date(),
        paymentApprovedBy: req.user.id
      },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        }
      }
    })

    res.json({
      success: true,
      participant: updatedParticipant,
      message: 'Payment approved successfully'
    })

  } catch (error) {
    logger.error('Approve payment error:', error)
    next(error)
  }
})

// Reject payment
router.put('/:id/payment/reject', protect, async (req, res, next) => {
  try {
    const participantId = req.params.id // Keep as string for UUID
    const { adminNotes } = req.body

    if (!adminNotes) {
      return res.status(400).json({
        success: false,
        message: 'Admin notes are required when rejecting payment'
      })
    }

    // Check if participant exists
    const existingParticipant = await prisma.participant.findUnique({
      where: { id: participantId }
    })

    if (!existingParticipant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      })
    }

    // Add rejection entry to payment history
    const currentHistory = existingParticipant.paymentHistory || [];
    const rejectionEntry = createPaymentHistoryEntry(
      existingParticipant.paymentVersion || 1,
      'rejected',
      null,
      adminNotes,
      req.user.id
    );
    const updatedPaymentHistory = [...currentHistory, rejectionEntry];

    // Update payment status
    const updatedParticipant = await prisma.participant.update({
      where: { id: participantId },
      data: {
        paymentStatus: 'rejected',
        paymentHistory: updatedPaymentHistory,
        adminNotes: adminNotes,
        paymentRejectedAt: new Date(),
        paymentRejectedBy: req.user.id
      },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        }
      }
    })

    res.json({
      success: true,
      participant: updatedParticipant,
      message: 'Payment rejected successfully'
    })

  } catch (error) {
    logger.error('Reject payment error:', error)
    next(error)
  }
})

// Get payment history for a participant
router.get('/:id/payment/history', protect, async (req, res, next) => {
  try {
    const participantId = req.params.id

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      select: {
        id: true,
        fullName: true,
        registrationNumber: true,
        paymentStatus: true,
        paymentVersion: true,
        paymentHistory: true,
        paymentProof: true,
        adminNotes: true,
        agency: {
          select: {
            name: true,
            code: true
          }
        }
      }
    })

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      })
    }

    res.json({
      success: true,
      data: {
        participant: participant,
        paymentHistory: participant.paymentHistory || [],
        currentVersion: participant.paymentVersion || 1
      }
    })

  } catch (error) {
    logger.error('Get payment history error:', error)
    next(error)
  }
})

// POST /api/participants/sync-progress - Sync progress percentage for all participants
router.post('/sync-progress', protect, requireRole(['admin', 'super_admin']), async (req, res, next) => {
  try {
    // Get all participants
    const participants = await prisma.participant.findMany({
      select: {
        id: true,
        status: true,
        progressPercentage: true,
        currentProgressStep: true
      }
    })

    let updatedCount = 0

    // Update each participant with correct progress
    for (const participant of participants) {
      const correctProgress = getProgressPercentage(participant.status)
      const correctStep = getProgressStep(participant.status)
      
      if (participant.progressPercentage !== correctProgress || 
          participant.currentProgressStep !== correctStep) {
        
        await prisma.participant.update({
          where: { id: participant.id },
          data: {
            progressPercentage: correctProgress,
            currentProgressStep: correctStep
          }
        })
        
        updatedCount++
      }
    }

    res.json({
      success: true,
      message: `Progress updated for ${updatedCount} participants`,
      data: {
        totalParticipants: participants.length,
        updatedCount
      }
    })

  } catch (error) {
    logger.error('Sync progress error:', error)
    next(error)
  }
})

export default router;