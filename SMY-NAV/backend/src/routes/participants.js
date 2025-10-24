import express from 'express';
import { body, validationResult, query } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';

import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { protect } from '../middleware/auth.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

const router = express.Router();

// Configure multer for temporary file storage before uploading to Cloudinary
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
  CCM_CMHBT: {
    name: 'CCM CMHBT',
    description: 'Pelatihan manajemen kerumunan dan krisis untuk hotel manager di kapal pesiar. Mencakup prosedur evakuasi, komunikasi darurat, dan manajemen penumpang.',
    duration: '3 hari',
    processingTime: '2-3 minggu',
    certificate: 'CCM Certificate',
    requiredDocuments: ['ktp', 'ijazah', 'foto', 'surat_sehat', 'passport_optional', 'sertifikat_bst']
  },
  CCM_CMT: {
    name: 'CCM CMT',
    description: 'Pelatihan manajemen kerumunan dan krisis untuk crisis management team di kapal pesiar. Fokus pada koordinasi tim dan pengambilan keputusan dalam situasi darurat.',
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
  query('agencyOnly').optional().isBoolean().withMessage('AgencyOnly must be boolean')
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
      agencyOnly
    } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause based on user role
    const where = {};

    // Role-based filtering
    if (req.user.role === 'agent' || agencyOnly === 'true') {
      // Agent hanya melihat data agency mereka sendiri
      where.agencyId = req.user.agencyId;
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

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        participants,
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

    res.json({
      success: true,
      data: { participant }
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

    // Generate registration number
    const agencyCode = req.user.agency?.code || 'AGN';
    const year = new Date().getFullYear();
    const count = await prisma.participant.count({
      where: { agencyId: req.user.agencyId }
    });
    const registrationNumber = `SMY-${agencyCode}-${String(count + 1).padStart(3, '0')}-${year}`;

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
        currentProgressStep: 1,
        progressPercentage: 16.67,
        agencyId: req.user.agencyId,
        createdById: req.user.id,
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
  { name: 'sertifikat_bst', maxCount: 1 }
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
    .isIn(['draft', 'submitted', 'verified', 'approved', 'training', 'completed', 'rejected'])
    .withMessage('Invalid status')
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
      
      // Process each uploaded file for Cloudinary upload
      Object.keys(uploadedFiles).forEach(fieldname => {
        const file = uploadedFiles[fieldname][0];
        uploadPromises.push(
          uploadToCloudinary(file, `smy-nav/participants/${existingParticipant.registrationNumber}`)
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
        console.log('All files uploaded to Cloudinary successfully');
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        return res.status(500).json({
          success: false,
          error: { message: `File upload failed: ${uploadError.message}` }
        });
      }
    }

    // Convert birthDate if provided
    if (updateData.birthDate) {
      updateData.birthDate = new Date(updateData.birthDate);
    }

    // Update participant
    const participant = await prisma.participant.update({
      where: { id },
      data: {
        ...updateData,
        documents: updatedDocuments,
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
  { name: 'sertifikat_bst', maxCount: 1 }
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
    const programsNeedingBST = ['SAT', 'CCM_CMHBT', 'CCM_CMT', 'SDSD', 'PSCRB', 'UPDATING_BST'];
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

    // Generate registration number
    const agencyCode = req.user.agency?.code || 'AGN';
    const year = new Date().getFullYear();
    const count = await prisma.participant.count({
      where: { agencyId: req.user.agencyId }
    });
    const registrationNumber = `SMY-${agencyCode}-${String(count + 1).padStart(3, '0')}-${year}`;

    // Upload files to Cloudinary and prepare documents object
    const documents = {};
    const uploadPromises = [];
    
    // Process each uploaded file for Cloudinary upload
    Object.keys(uploadedFiles).forEach(fieldname => {
      const file = uploadedFiles[fieldname][0];
      uploadPromises.push(
        uploadToCloudinary(file, `smy-nav/participants/${registrationNumber}`)
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
      console.log('All files uploaded to Cloudinary successfully');
    } catch (uploadError) {
      console.error('Cloudinary upload failed:', uploadError);
      return res.status(500).json({
        success: false,
        error: { message: `File upload failed: ${uploadError.message}` }
      });
    }

    // Extract fullName from request
    const fullName = req.body.fullName || 'Peserta Baru';
    
    // Create participant submissions for each training program
    const participants = [];
    
    for (const trainingProgram of trainingPrograms) {
      const participantData = {
        fullName: `${fullName} (${trainingProgram})`, // Use actual name from form
        nik: null, // Will be filled later when admin/user complete the data
        trainingProgram,
        registrationNumber: `${registrationNumber}-${trainingProgram}`,
        status: 'draft', // Changed to draft - agency needs to submit manually
        currentProgressStep: 1,
        progressPercentage: 10, // Lower percentage for draft status
        // Personal data will be filled later by admin or user - keep as null for clean display
        birthDate: null,
        birthPlace: null,
        gender: null,
        address: null,
        email: null,
        phone: null,
        // Documents stored as JSON in the participant record
        documents: documents,
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

    // Find participant and ensure it belongs to the agent's agency
    const participant = await prisma.participant.findFirst({
      where: {
        id,
        agencyId: req.user.agencyId
      }
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
        progressPercentage: 25, // Increase progress when submitted
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

export default router;