import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { protect } from '../middleware/auth.js'
import logger from '../utils/logger.js'

const router = Router()
const prisma = new PrismaClient()

// Get all invoices (participants with payment info) for admin
router.get('/', protect, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      paymentOption,
      paymentStatus,
      trainingProgram,
      agencyName,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    // Build where clause
    const whereClause = {
      // Only include participants with payment option
      paymentOption: {
        not: null
      }
    }

    // Add search filter (name, NIK, registration number, agency name)
    if (search) {
      whereClause.OR = [
        {
          fullName: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          nik: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          registrationNumber: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          agency: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ]
    }

    // Add payment option filter
    if (paymentOption) {
      whereClause.paymentOption = paymentOption
    }

    // Add payment status filter
    if (paymentStatus) {
      whereClause.paymentStatus = paymentStatus
    }

    // Add training program filter
    if (trainingProgram) {
      whereClause.trainingProgram = trainingProgram
    }

    // Add agency name filter (legacy support)
    if (agencyName) {
      if (whereClause.OR) {
        // If search already exists, merge with agency filter
        whereClause.AND = [
          { OR: whereClause.OR },
          {
            agency: {
              name: {
                contains: agencyName,
                mode: 'insensitive'
              }
            }
          }
        ]
        delete whereClause.OR
      } else {
        whereClause.agency = {
          name: {
            contains: agencyName,
            mode: 'insensitive'
          }
        }
      }
    }

    // Add date range filter
    if (startDate || endDate) {
      whereClause.createdAt = {}
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate)
      }
    }

    // Calculate skip for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Get total count for pagination
    const totalCount = await prisma.participant.count({
      where: whereClause
    })

    // Get participants (invoices)
    const participants = await prisma.participant.findMany({
      where: whereClause,
      skip,
      take: parseInt(limit),
      orderBy: {
        [sortBy]: sortOrder
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

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / parseInt(limit))

    res.json({
      success: true,
      data: participants,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalCount,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    })

  } catch (error) {
    logger.error('Fetch invoices error:', error)
    next(error)
  }
})

// Get invoice detail by participant ID
router.get('/:id', protect, async (req, res, next) => {
  try {
    const participantId = parseInt(req.params.id)

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            phone: true,
            email: true
          }
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true,
            email: true
          }
        }
      }
    })

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      })
    }

    // Calculate training program costs
    const trainingPrograms = participant.trainingPrograms || []
    const programPrices = {
      'BST': 1850000,
      'SAT': 950000,
      'CCM_CMT': 650000,
      'CCM_CMHBT': 650000,
      'SDSD': 950000,
      'PSCRB': 1200000,
      'UPDATING_BST': 1850000
    }

    let totalCost = 0
    const programDetails = trainingPrograms.map(program => {
      const cost = programPrices[program] || 0
      totalCost += cost
      return {
        name: program,
        cost: cost
      }
    })

    const invoice = {
      ...participant,
      programDetails,
      totalCost,
      invoiceNumber: `INV-${participant.id.toString().padStart(6, '0')}`,
      invoiceDate: participant.createdAt
    }

    res.json({
      success: true,
      data: invoice
    })

  } catch (error) {
    logger.error('Fetch invoice detail error:', error)
    next(error)
  }
})

export default router