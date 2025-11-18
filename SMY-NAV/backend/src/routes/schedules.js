import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/schedules - Get all schedules with filtering
router.get('/', protect, async (req, res) => {
  try {
    const { search, trainingProgram, isActive, mode, page = 1, limit = 10 } = req.query;
    
    const where = {};
    
    // Search filter - search in scheduleName or trainingProgram
    if (search) {
      where.OR = [
        {
          scheduleName: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          trainingProgram: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }
    
    // Training program filter
    if (trainingProgram) {
      where.trainingProgram = trainingProgram;
    }
    
    // Status filter
    if (isActive !== undefined && isActive !== '' && isActive !== null) {
      where.isActive = isActive === 'true';
    }
    
    // Mode filter
    if (mode) {
      where.mode = mode;
    }

    const schedules = await prisma.trainingSchedule.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        participants: {
          include: {
            participant: {
              select: {
                id: true,
                fullName: true,
                email: true,
                agency: true,
                status: true
              }
            }
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const total = await prisma.trainingSchedule.count({ where });

    res.json({
      success: true,
      data: schedules,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schedules'
    });
  }
});

// GET /api/schedules/:id - Get specific schedule
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await prisma.trainingSchedule.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        participants: {
          include: {
            participant: {
              select: {
                id: true,
                fullName: true,
                email: true,
                agency: true,
                status: true
              }
            }
          }
        }
      }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schedule'
    });
  }
});

// POST /api/schedules - Create new schedule (Admin only)
router.post('/', protect, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const {
      trainingProgram,
      scheduleName,
      startDate,
      endDate,
      startTime,
      endTime,
      mode = 'offline',
      location,
      onlineLink,
      dressCode,
      requirements,
      contactPerson,
      contactPhone,
      reminderDays = [7, 3, 1],
      notes,
      participantIds = [],
      maxParticipants = 24
    } = req.body;

    // Validation
    if (!trainingProgram || !scheduleName || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Training program, schedule name, start date, and end date are required'
      });
    }

    // Validate training program
    const validPrograms = ['BST', 'SAT', 'CCM_CMHBT', 'CCM_CMT', 'SDSD', 'PSCRB', 'SB', 'UPDATING_BST'];
    if (!validPrograms.includes(trainingProgram)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid training program'
      });
    }

    // Check for duplicate schedule name
    const existingSchedule = await prisma.trainingSchedule.findFirst({
      where: {
        scheduleName,
        trainingProgram
      }
    });

    if (existingSchedule) {
      return res.status(400).json({
        success: false,
        error: 'Schedule name already exists for this training program'
      });
    }

    // Validate participant IDs if provided
    if (participantIds.length > 0) {
      if (participantIds.length > maxParticipants) {
        return res.status(400).json({
          success: false,
          error: `Cannot assign more than ${maxParticipants} participants`
        });
      }

      // Check if all participants exist and match the training program
      const participants = await prisma.participant.findMany({
        where: {
          id: { in: participantIds },
          trainingProgram
        }
      });

      if (participants.length !== participantIds.length) {
        return res.status(400).json({
          success: false,
          error: 'Some participants not found or do not match the training program'
        });
      }
    }

    const schedule = await prisma.trainingSchedule.create({
      data: {
        trainingProgram,
        scheduleName,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        startTime,
        endTime,
        mode,
        location,
        onlineLink,
        dressCode,
        requirements,
        contactPerson,
        contactPhone,
        reminderDays,
        notes,
        maxParticipants,
        currentParticipants: participantIds.length,
        createdBy: req.user.id,
        // Create participant assignments
        participants: {
          create: participantIds.map(participantId => ({
            participantId,
            assignedAt: new Date(),
            assignedBy: req.user.id
          }))
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        participants: {
          include: {
            participant: {
              select: {
                id: true,
                fullName: true,
                email: true,
                agency: true,
                status: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: schedule,
      message: 'Schedule created successfully'
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create schedule'
    });
  }
});

// PUT /api/schedules/:id - Update schedule (Admin only)
router.put('/:id', protect, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      trainingProgram,
      scheduleName,
      startDate,
      endDate,
      startTime,
      endTime,
      mode,
      location,
      onlineLink,
      dressCode,
      requirements,
      contactPerson,
      contactPhone,
      reminderDays,
      isActive,
      notes
    } = req.body;

    // Check if schedule exists
    const existingSchedule = await prisma.trainingSchedule.findUnique({
      where: { id }
    });

    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }

    // Validate training program if provided
    if (trainingProgram) {
      const validPrograms = ['BST', 'SAT', 'CCM_CMHBT', 'CCM_CMT', 'SDSD', 'PSCRB', 'SB', 'UPDATING_BST'];
      if (!validPrograms.includes(trainingProgram)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid training program'
        });
      }
    }

    const updateData = {};
    if (trainingProgram !== undefined) updateData.trainingProgram = trainingProgram;
    if (scheduleName !== undefined) updateData.scheduleName = scheduleName;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (mode !== undefined) updateData.mode = mode;
    if (location !== undefined) updateData.location = location;
    if (onlineLink !== undefined) updateData.onlineLink = onlineLink;
    if (dressCode !== undefined) updateData.dressCode = dressCode;
    if (requirements !== undefined) updateData.requirements = requirements;
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
    if (reminderDays !== undefined) updateData.reminderDays = reminderDays;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (notes !== undefined) updateData.notes = notes;

    const schedule = await prisma.trainingSchedule.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: schedule,
      message: 'Schedule updated successfully'
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update schedule'
    });
  }
});

// DELETE /api/schedules/:id - Delete schedule (Admin only)
router.delete('/:id', protect, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if schedule exists
    const existingSchedule = await prisma.trainingSchedule.findUnique({
      where: { id }
    });

    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }

    await prisma.trainingSchedule.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete schedule'
    });
  }
});

// GET /api/schedules/active/:trainingProgram - Get active schedule for specific training program
router.get('/active/:trainingProgram', protect, async (req, res) => {
  try {
    const { trainingProgram } = req.params;

    const schedule = await prisma.trainingSchedule.findFirst({
      where: {
        trainingProgram,
        isActive: true,
        startDate: {
          gte: new Date() // Future or current schedules
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        participants: {
          include: {
            participant: {
              select: {
                id: true,
                fullName: true,
                email: true,
                agency: true,
                status: true
              }
            }
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Error fetching active schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active schedule'
    });
  }
});

// POST /api/schedules/:id/participants - Add participants to schedule
router.post('/:id/participants', protect, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { participantIds } = req.body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Participant IDs are required'
      });
    }

    // Get schedule with current participants
    const schedule = await prisma.trainingSchedule.findUnique({
      where: { id },
      include: {
        participants: true
      }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }

    // Check capacity
    const currentCount = schedule.participants.length;
    const newCount = currentCount + participantIds.length;
    
    if (newCount > schedule.maxParticipants) {
      return res.status(400).json({
        success: false,
        error: `Cannot add participants. Would exceed maximum capacity of ${schedule.maxParticipants}`
      });
    }

    // Check if participants exist and match training program
    const participants = await prisma.participant.findMany({
      where: {
        id: { in: participantIds },
        trainingProgram: schedule.trainingProgram
      }
    });

    if (participants.length !== participantIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Some participants not found or do not match the training program'
      });
    }

    // Check for existing assignments
    const existingAssignments = await prisma.scheduleParticipant.findMany({
      where: {
        scheduleId: id,
        participantId: { in: participantIds }
      }
    });

    if (existingAssignments.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Some participants are already assigned to this schedule'
      });
    }

    // Create assignments
    await prisma.scheduleParticipant.createMany({
      data: participantIds.map(participantId => ({
        scheduleId: id,
        participantId,
        assignedAt: new Date(),
        assignedBy: req.user.id
      }))
    });

    // Update current participants count
    await prisma.trainingSchedule.update({
      where: { id },
      data: {
        currentParticipants: newCount
      }
    });

    res.json({
      success: true,
      message: 'Participants added successfully'
    });

  } catch (error) {
    console.error('Error adding participants to schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add participants to schedule'
    });
  }
});

// DELETE /api/schedules/:id/participants/:participantId - Remove participant from schedule
router.delete('/:id/participants/:participantId', protect, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id, participantId } = req.params;

    // Check if assignment exists
    const assignment = await prisma.scheduleParticipant.findFirst({
      where: {
        scheduleId: id,
        participantId
      }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Participant assignment not found'
      });
    }

    // Remove assignment
    await prisma.scheduleParticipant.delete({
      where: {
        id: assignment.id
      }
    });

    // Update current participants count
    const currentCount = await prisma.scheduleParticipant.count({
      where: { scheduleId: id }
    });

    await prisma.trainingSchedule.update({
      where: { id },
      data: {
        currentParticipants: currentCount
      }
    });

    res.json({
      success: true,
      message: 'Participant removed successfully'
    });

  } catch (error) {
    console.error('Error removing participant from schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove participant from schedule'
    });
  }
});

export default router;