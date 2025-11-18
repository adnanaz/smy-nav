const express = require('express');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const router = express.Router();
const prisma = new PrismaClient();

// Register participant (public endpoint)
router.post('/register-participant', async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      birthDate,
      occupation,
      company,
      interestedProgram,
      source,
      password
    } = req.body;

    console.log('Participant registration request:', {
      fullName,
      email,
      phone,
      birthDate,
      occupation,
      company,
      interestedProgram,
      source
    });

    // Validation
    if (!fullName || !email || !phone || !birthDate || !occupation || !company || !interestedProgram || !source || !password) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format email tidak valid'
      });
    }

    // Validate phone format (Indonesian)
    const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
    if (!phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
      return res.status(400).json({
        success: false,
        message: 'Format nomor HP tidak valid'
      });
    }

    // Validate age (minimum 17 years old)
    const birthDateObj = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDateObj.getFullYear();
    if (age < 17) {
      return res.status(400).json({
        success: false,
        message: 'Minimal berusia 17 tahun'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password minimal 6 karakter'
      });
    }

    const passwordRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password harus mengandung huruf besar, huruf kecil, dan angka'
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate username from email (before @)
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

    // Create user with participant role
    const newUser = await prisma.user.create({
      data: {
        username,
        fullName,
        email,
        passwordHash: hashedPassword,
        role: 'participant',
        isActive: true,
        // Additional participant data
        phone,
        birthDate: new Date(birthDate),
        occupation,
        company,
        interestedProgram,
        source,
        registrationDate: new Date(),
        registrationType: 'walk-in'
      }
    });

    console.log('New participant created:', newUser.id);

    // Generate JWT token for auto-login
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email, 
        role: newUser.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { passwordHash, ...userResponse } = newUser;

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Participant registration error:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Email atau username sudah terdaftar'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan sistem',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get participant dashboard data
router.get('/participant/dashboard', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get participant data
    const participant = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        occupation: true,
        company: true,
        interestedProgram: true,
        registrationDate: true
      }
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    // Get training schedules for interested program
    const availableSchedules = await prisma.schedule.findMany({
      where: {
        trainingProgram: participant.interestedProgram,
        status: 'active',
        startDate: {
          gte: new Date()
        }
      },
      select: {
        id: true,
        trainingProgram: true,
        startDate: true,
        endDate: true,
        mode: true,
        location: true,
        price: true,
        availableSlots: true,
        totalSlots: true
      },
      orderBy: {
        startDate: 'asc'
      },
      take: 5
    });

    // Get participant enrollments (if any)
    const enrollments = await prisma.participant.findMany({
      where: { 
        email: participant.email 
      },
      include: {
        schedule: {
          select: {
            id: true,
            trainingProgram: true,
            startDate: true,
            endDate: true,
            mode: true,
            location: true,
            status: true
          }
        }
      }
    });

    // Get recent activities
    const recentActivities = [
      {
        id: 1,
        type: 'registration',
        title: 'Akun berhasil dibuat',
        description: `Selamat datang di SMY! Akun Anda telah berhasil dibuat.`,
        date: participant.registrationDate,
        icon: 'mdi-account-plus',
        color: 'success'
      }
    ];

    // Add enrollment activities
    enrollments.forEach((enrollment, index) => {
      recentActivities.push({
        id: index + 2,
        type: 'enrollment',
        title: 'Terdaftar dalam pelatihan',
        description: `Anda terdaftar dalam pelatihan ${enrollment.schedule.trainingProgram}`,
        date: enrollment.registrationDate,
        icon: 'mdi-school',
        color: 'primary'
      });
    });

    res.json({
      success: true,
      data: {
        participant,
        availableSchedules,
        enrollments: enrollments.map(e => ({
          ...e,
          schedule: e.schedule
        })),
        recentActivities: recentActivities.sort((a, b) => new Date(b.date) - new Date(a.date)),
        stats: {
          totalEnrollments: enrollments.length,
          completedTrainings: enrollments.filter(e => e.schedule.status === 'completed').length,
          upcomingTrainings: enrollments.filter(e => 
            e.schedule.status === 'active' && new Date(e.schedule.startDate) > new Date()
          ).length,
          availablePrograms: availableSchedules.length
        }
      }
    });

  } catch (error) {
    console.error('Get participant dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan sistem',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Enroll in training program
router.post('/participant/enroll', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { scheduleId } = req.body;

    if (!scheduleId) {
      return res.status(400).json({
        success: false,
        message: 'Schedule ID is required'
      });
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get schedule data
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    // Check if schedule is active and has available slots
    if (schedule.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Jadwal pelatihan tidak aktif'
      });
    }

    if (schedule.availableSlots <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Kuota pelatihan sudah penuh'
      });
    }

    // Check if user already enrolled
    const existingEnrollment = await prisma.participant.findFirst({
      where: {
        email: user.email,
        scheduleId: scheduleId
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Anda sudah terdaftar dalam jadwal ini'
      });
    }

    // Create enrollment
    const enrollment = await prisma.participant.create({
      data: {
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        company: user.company,
        position: user.occupation,
        scheduleId: scheduleId,
        status: 'registered',
        registrationDate: new Date(),
        // Additional participant fields
        birthDate: user.birthDate,
        address: '', // Can be filled later
        emergencyContact: '', // Can be filled later
        emergencyPhone: '' // Can be filled later
      }
    });

    // Update available slots
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        availableSlots: schedule.availableSlots - 1
      }
    });

    res.json({
      success: true,
      message: 'Berhasil mendaftar pelatihan',
      data: enrollment
    });

  } catch (error) {
    console.error('Participant enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan sistem',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;