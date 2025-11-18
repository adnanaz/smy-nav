import express from 'express';
import prisma from '../config/database.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', protect, async (req, res) => {
  try {
    const user = req.user;
    
    // Base query conditions based on user role
    const whereConditions = {};
    if (user.role === 'agent') {
      whereConditions.agencyId = user.agencyId;
    }

    // Get current date for comparisons
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Participants statistics
    const totalParticipants = await prisma.participant.count({
      where: {
        ...whereConditions,
        ...(user.role === 'admin' ? { status: { not: 'draft' } } : {})
      }
    });

    const participantsThisMonth = await prisma.participant.count({
      where: {
        ...whereConditions,
        createdAt: { gte: firstDayThisMonth },
        ...(user.role === 'admin' ? { status: { not: 'draft' } } : {})
      }
    });

    const participantsLastMonth = await prisma.participant.count({
      where: {
        ...whereConditions,
        createdAt: { 
          gte: firstDayLastMonth,
          lte: lastDayLastMonth 
        },
        ...(user.role === 'admin' ? { status: { not: 'draft' } } : {})
      }
    });

    // Training programs statistics
    let activeTrainings = 0;
    try {
      activeTrainings = await prisma.trainingSchedule.count({
        where: {
          isActive: true,
          startDate: { gte: now }
        }
      });
    } catch (scheduleError) {
      console.error('Active trainings error:', scheduleError);
      // Fallback: count unique training programs from participants
      const uniquePrograms = await prisma.participant.groupBy({
        by: ['trainingProgram'],
        where: {
          ...whereConditions,
          status: { in: ['verified', 'waiting_quota', 'sent_to_center', 'waiting_dispatch'] }
        }
      });
      activeTrainings = uniquePrograms.length;
    }

    const completedParticipants = await prisma.participant.count({
      where: {
        ...whereConditions,
        status: 'completed'
      }
    });

    const pendingReview = await prisma.participant.count({
      where: {
        ...whereConditions,
        status: 'submitted'
      }
    });

    // Payment statistics (admin only)
    let paymentStats = null;
    if (user.role === 'admin') {
      try {
        const pendingPayments = await prisma.participant.count({
          where: {
            paymentOption: 'pay_later',
            status: 'completed',
            OR: [
              { paymentStatus: 'pending' },
              { paymentStatus: null },
              { paymentProof: null }
            ]
          }
        });

        const approvedPayments = await prisma.participant.count({
          where: {
            paymentStatus: 'approved'
          }
        });

        const totalRevenue = await calculateTotalRevenue();

        paymentStats = {
          pendingPayments,
          approvedPayments,
          totalRevenue
        };
      } catch (paymentError) {
        console.error('Payment stats error:', paymentError);
        // Set default payment stats if there's an error
        paymentStats = {
          pendingPayments: 0,
          approvedPayments: 0,
          totalRevenue: 0
        };
      }
    }

    // Calculate trends
    const participantTrend = participantsLastMonth > 0 
      ? ((participantsThisMonth - participantsLastMonth) / participantsLastMonth) * 100 
      : participantsThisMonth > 0 ? 100 : 0;

    const stats = {
      totalParticipants,
      activeTrainings,
      completedParticipants,
      pendingReview,
      participantTrend: Math.round(participantTrend),
      paymentStats
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get recent activities
router.get('/activities', protect, async (req, res) => {
  try {
    const user = req.user;
    const limit = parseInt(req.query.limit) || 10;

    // Base query conditions
    const whereConditions = {};
    if (user.role === 'agent') {
      whereConditions.agencyId = user.agencyId;
    }

    // Get recent participants
    const recentParticipants = await prisma.participant.findMany({
      where: {
        ...whereConditions,
        ...(user.role === 'admin' ? { status: { not: 'draft' } } : {})
      },
      include: {
        agency: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    // Get recent schedules (admin only)
    let recentSchedules = [];
    if (user.role === 'admin') {
      try {
        recentSchedules = await prisma.trainingSchedule.findMany({
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        });
      } catch (scheduleError) {
        console.error('Recent schedules error:', scheduleError);
        recentSchedules = [];
      }
    }

    // Format activities
    const activities = [];

    // Add participant activities
    recentParticipants.forEach(participant => {
      let activityType = '';
      let color = '';
      let icon = '';

      switch (participant.status) {
        case 'submitted':
          activityType = 'submitted registration';
          color = 'info';
          icon = 'mdi-account-plus';
          break;
        case 'verified':
          activityType = 'document verified';
          color = 'success';
          icon = 'mdi-file-check';
          break;
        case 'completed':
          activityType = 'training completed';
          color = 'primary';
          icon = 'mdi-school';
          break;
        default:
          activityType = 'registered';
          color = 'info';
          icon = 'mdi-account-plus';
      }

      activities.push({
        title: `Participant ${activityType}`,
        description: `${participant.fullName} - ${participant.trainingProgram}${participant.agency ? ` (${participant.agency.name})` : ''}`,
        time: formatTimeAgo(participant.createdAt),
        icon,
        color,
        type: 'participant'
      });
    });

    // Add schedule activities (admin only)
    if (user.role === 'admin') {
      recentSchedules.forEach(schedule => {
        activities.push({
          title: 'New training schedule',
          description: `${schedule.scheduleName} - ${schedule.trainingProgram}`,
          time: formatTimeAgo(schedule.createdAt),
          icon: 'mdi-calendar-plus',
          color: 'warning',
          type: 'schedule'
        });
      });
    }

    // Sort by date and limit
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: activities.slice(0, limit)
    });

  } catch (error) {
    console.error('Dashboard activities error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard activities'
    });
  }
});

// Get training progress overview
router.get('/progress', protect, async (req, res) => {
  try {
    const user = req.user;
    
    const whereConditions = {};
    if (user.role === 'agent') {
      whereConditions.agencyId = user.agencyId;
    }

    // Get participants by status
    const participantsByStatus = await prisma.participant.groupBy({
      by: ['status'],
      where: {
        ...whereConditions,
        ...(user.role === 'admin' ? { status: { not: 'draft' } } : {})
      },
      _count: {
        id: true
      }
    });

    // Calculate progress percentages
    const totalParticipants = participantsByStatus.reduce((sum, item) => sum + item._count.id, 0);
    
    const progressData = [
      {
        label: 'Documentation',
        value: calculateProgressPercentage(['submitted', 'verified', 'waiting_quota', 'sent_to_center', 'waiting_dispatch', 'completed'], participantsByStatus, totalParticipants),
        color: 'info'
      },
      {
        label: 'Document Verified',
        value: calculateProgressPercentage(['verified', 'waiting_quota', 'sent_to_center', 'waiting_dispatch', 'completed'], participantsByStatus, totalParticipants),
        color: 'success'
      },
      {
        label: 'In Progress',
        value: calculateProgressPercentage(['waiting_quota', 'sent_to_center', 'waiting_dispatch'], participantsByStatus, totalParticipants),
        color: 'warning'
      },
      {
        label: 'Completed',
        value: calculateProgressPercentage(['completed'], participantsByStatus, totalParticipants),
        color: 'primary'
      }
    ];

    const overallProgress = Math.round(
      progressData.reduce((sum, item) => sum + item.value, 0) / progressData.length
    );

    res.json({
      success: true,
      data: {
        overallProgress,
        breakdown: progressData
      }
    });

  } catch (error) {
    console.error('Dashboard progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch progress data'
    });
  }
});

// Helper functions
async function calculateTotalRevenue() {
  try {
    const trainingPrices = {
      BST: 1850000,
      SAT: 950000,
      CCM_CMT: 650000,
      CCM_CMHBT: 650000,
      SDSD: 950000,
      PSCRB: 1200000,
      SB: 500000,
      UPDATING_BST: 750000
    };

    const approvedParticipants = await prisma.participant.findMany({
      where: {
        paymentStatus: 'approved'
      },
      select: {
        trainingProgram: true
      }
    });

    return approvedParticipants.reduce((total, participant) => {
      return total + (trainingPrices[participant.trainingProgram] || 0);
    }, 0);
  } catch (error) {
    console.error('Calculate revenue error:', error);
    return 0;
  }
}

function calculateProgressPercentage(statuses, participantsByStatus, total) {
  if (total === 0) return 0;
  
  const count = participantsByStatus
    .filter(item => statuses.includes(item.status))
    .reduce((sum, item) => sum + item._count.id, 0);
    
  return Math.round((count / total) * 100);
}

function formatTimeAgo(date) {
  const now = new Date();
  const diffInMilliseconds = now - new Date(date);
  const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  } else {
    return `${diffInDays} days ago`;
  }
}

export default router;