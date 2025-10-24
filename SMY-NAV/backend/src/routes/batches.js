const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { authenticateToken, requireRole } = require('../middleware/auth')

const prisma = new PrismaClient()

// Get all batches with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      program, 
      status, 
      year, 
      page = 1, 
      limit = 10 
    } = req.query

    const where = {}
    
    if (program) where.trainingProgram = program
    if (status) where.status = status
    if (year) where.year = parseInt(year)

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [batches, total] = await Promise.all([
      prisma.trainingBatch.findMany({
        where,
        include: {
          participants: {
            select: {
              id: true,
              fullName: true,
              status: true
            }
          },
          creator: {
            select: {
              id: true,
              fullName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.trainingBatch.count({ where })
    ])

    // Calculate fill percentage for each batch
    const batchesWithStats = batches.map(batch => ({
      ...batch,
      currentParticipants: batch.participants.length,
      fillPercentage: Math.round((batch.participants.length / batch.maxParticipants) * 100),
      isReady: batch.participants.length >= batch.minParticipants,
      isFull: batch.participants.length >= batch.maxParticipants
    }))

    res.json({
      success: true,
      data: batchesWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Error fetching batches:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch batches'
    })
  }
})

// Get batch by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const batch = await prisma.trainingBatch.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            agency: {
              select: {
                id: true,
                name: true
              }
            },
            creator: {
              select: {
                id: true,
                fullName: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    })

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      })
    }

    const batchWithStats = {
      ...batch,
      currentParticipants: batch.participants.length,
      fillPercentage: Math.round((batch.participants.length / batch.maxParticipants) * 100),
      isReady: batch.participants.length >= batch.minParticipants,
      isFull: batch.participants.length >= batch.maxParticipants
    }

    res.json({
      success: true,
      data: batchWithStats
    })
  } catch (error) {
    console.error('Error fetching batch:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch batch'
    })
  }
})

// Create new batch
router.post('/', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const {
      trainingProgram,
      minParticipants = 15,
      maxParticipants = 24,
      targetStartDate,
      notes
    } = req.body

    if (!trainingProgram) {
      return res.status(400).json({
        success: false,
        message: 'Training program is required'
      })
    }

    const currentYear = new Date().getFullYear()

    // Get next sequence number
    const lastBatch = await prisma.trainingBatch.findFirst({
      where: {
        trainingProgram,
        year: currentYear
      },
      orderBy: {
        sequenceNumber: 'desc'
      }
    })

    const sequenceNumber = lastBatch ? lastBatch.sequenceNumber + 1 : 1
    const batchNumber = `${trainingProgram}-${currentYear}-${sequenceNumber.toString().padStart(3, '0')}`

    const batch = await prisma.trainingBatch.create({
      data: {
        batchNumber,
        trainingProgram,
        year: currentYear,
        sequenceNumber,
        minParticipants: parseInt(minParticipants),
        maxParticipants: parseInt(maxParticipants),
        targetStartDate: targetStartDate ? new Date(targetStartDate) : null,
        notes,
        createdBy: req.user.id
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: batch,
      message: 'Batch created successfully'
    })
  } catch (error) {
    console.error('Error creating batch:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create batch'
    })
  }
})

// Update batch
router.put('/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params
    const {
      minParticipants,
      maxParticipants,
      targetStartDate,
      actualStartDate,
      completionDate,
      notes,
      status
    } = req.body

    const existingBatch = await prisma.trainingBatch.findUnique({
      where: { id }
    })

    if (!existingBatch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      })
    }

    const updateData = {}
    
    if (minParticipants !== undefined) updateData.minParticipants = parseInt(minParticipants)
    if (maxParticipants !== undefined) updateData.maxParticipants = parseInt(maxParticipants)
    if (targetStartDate !== undefined) updateData.targetStartDate = targetStartDate ? new Date(targetStartDate) : null
    if (actualStartDate !== undefined) updateData.actualStartDate = actualStartDate ? new Date(actualStartDate) : null
    if (completionDate !== undefined) updateData.completionDate = completionDate ? new Date(completionDate) : null
    if (notes !== undefined) updateData.notes = notes
    if (status !== undefined) updateData.status = status

    const batch = await prisma.trainingBatch.update({
      where: { id },
      data: updateData,
      include: {
        participants: {
          select: {
            id: true,
            fullName: true,
            status: true
          }
        },
        creator: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    })

    res.json({
      success: true,
      data: batch,
      message: 'Batch updated successfully'
    })
  } catch (error) {
    console.error('Error updating batch:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update batch'
    })
  }
})

// Send batch to center
router.post('/:id/send-to-center', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params

    const batch = await prisma.trainingBatch.findUnique({
      where: { id },
      include: {
        participants: true
      }
    })

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      })
    }

    if (batch.status !== 'ready') {
      return res.status(400).json({
        success: false,
        message: 'Batch is not ready to be sent'
      })
    }

    if (batch.participants.length < batch.minParticipants) {
      return res.status(400).json({
        success: false,
        message: `Batch needs at least ${batch.minParticipants} participants`
      })
    }

    // Update batch status
    const updatedBatch = await prisma.trainingBatch.update({
      where: { id },
      data: {
        status: 'sent_to_center'
      }
    })

    // Update all participants in this batch
    await prisma.participant.updateMany({
      where: {
        batchId: id,
        status: 'waiting_quota'
      },
      data: {
        status: 'sent_to_center',
        currentProgressStep: 4
      }
    })

    res.json({
      success: true,
      data: updatedBatch,
      message: 'Batch sent to center successfully'
    })
  } catch (error) {
    console.error('Error sending batch to center:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to send batch to center'
    })
  }
})

// Delete batch (only if status is 'forming' and no participants)
router.delete('/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params

    const batch = await prisma.trainingBatch.findUnique({
      where: { id },
      include: {
        participants: true
      }
    })

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      })
    }

    if (batch.status !== 'forming') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete batch that is not in forming status'
      })
    }

    if (batch.participants.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete batch that has participants'
      })
    }

    await prisma.trainingBatch.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Batch deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting batch:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete batch'
    })
  }
})

// Get batch statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query

    const stats = await prisma.trainingBatch.groupBy({
      by: ['status', 'trainingProgram'],
      where: {
        year: parseInt(year)
      },
      _count: {
        id: true
      },
      _sum: {
        currentParticipants: true
      }
    })

    const totalBatches = await prisma.trainingBatch.count({
      where: { year: parseInt(year) }
    })

    const totalParticipants = await prisma.participant.count({
      where: {
        batch: {
          year: parseInt(year)
        }
      }
    })

    res.json({
      success: true,
      data: {
        stats,
        totalBatches,
        totalParticipants,
        year: parseInt(year)
      }
    })
  } catch (error) {
    console.error('Error fetching batch stats:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch batch statistics'
    })
  }
})

module.exports = router