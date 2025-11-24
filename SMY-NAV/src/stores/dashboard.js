import { defineStore } from 'pinia'
import axios from 'axios'

import { API_BASE_URL } from '@/config/api.js'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    // Statistics
    stats: {
      totalParticipants: 0,
      activeTrainings: 0,
      completedParticipants: 0,
      pendingReview: 0,
      participantTrend: 0,
      paymentStats: null
    },
    
    // Recent activities
    activities: [],
    
    // Progress data
    progressData: {
      overallProgress: 0,
      breakdown: []
    },
    
    // Loading states
    loading: {
      stats: false,
      activities: false,
      progress: false
    },
    
    // Error states
    error: null
  }),

  getters: {
    // Format currency for revenue display
    formattedRevenue: (state) => {
      if (!state.stats.paymentStats?.totalRevenue) return 'Rp 0'
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(state.stats.paymentStats.totalRevenue)
    },

    // Get dashboard stats formatted for display
    dashboardStats: (state) => {
      const userRole = JSON.parse(localStorage.getItem('user') || '{}')?.role
      
      let baseStats = []
      
      if (userRole === 'participant') {
        // Participant dashboard stats
        baseStats = [
          {
            title: 'My Enrollments',
            value: state.stats.totalParticipants.toString(),
            trend: state.stats.participantTrend,
            color: 'primary',
            icon: 'mdi-school'
          },
          {
            title: 'Upcoming Training',
            value: state.stats.activeTrainings.toString(),
            trend: 0,
            color: 'warning',
            icon: 'mdi-clock-outline'
          },
          {
            title: 'Completed',
            value: state.stats.completedParticipants.toString(),
            trend: 0,
            color: 'success',
            icon: 'mdi-check-circle'
          },
          {
            title: 'Available Programs',
            value: state.stats.pendingReview.toString(),
            trend: 0,
            color: 'info',
            icon: 'mdi-book-open-variant'
          }
        ]
      } else {
        // Admin/Agent dashboard stats
        baseStats = [
          {
            title: 'Total Participants',
            value: state.stats.totalParticipants.toString(),
            trend: state.stats.participantTrend,
            color: 'primary',
            icon: 'mdi-account-group'
          },
          {
            title: 'Active Training',
            value: state.stats.activeTrainings.toString(),
            trend: 5,
            color: 'success',
            icon: 'mdi-school'
          },
          {
            title: 'Completed',
            value: state.stats.completedParticipants.toString(),
            trend: 10,
            color: 'info',
            icon: 'mdi-check-circle'
          },
          {
            title: 'Pending Review',
            value: state.stats.pendingReview.toString(),
            trend: -2,
            color: 'warning',
            icon: 'mdi-clock-outline'
          }
        ]
      }

      // Add payment stats for admin
      if (state.stats.paymentStats) {
        baseStats.push({
          title: 'Revenue',
          value: state.formattedRevenue,
          trend: 12,
          color: 'success',
          icon: 'mdi-cash'
        })
      }

      return baseStats
    },

    // Check if user has access to payment data
    hasPaymentAccess: (state) => {
      return state.stats.paymentStats !== null
    }
  },

  actions: {
    // Fetch dashboard statistics
    async fetchStats() {
      this.loading.stats = true
      this.error = null

      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(`${API_BASE_URL}/dashboard/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.data.success) {
          this.stats = response.data.data
        } else {
          throw new Error(response.data.error || 'Failed to fetch statistics')
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        this.error = error.response?.data?.error || error.message || 'Failed to fetch statistics'
        
        // Set default values on error
        this.stats = {
          totalParticipants: 0,
          activeTrainings: 0,
          completedParticipants: 0,
          pendingReview: 0,
          participantTrend: 0,
          paymentStats: null
        }
      } finally {
        this.loading.stats = false
      }
    },

    // Fetch recent activities
    async fetchActivities(limit = 10) {
      this.loading.activities = true

      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(`${API_BASE_URL}/dashboard/activities`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: { limit }
        })

        if (response.data.success) {
          this.activities = response.data.data
        } else {
          throw new Error(response.data.error || 'Failed to fetch activities')
        }
      } catch (error) {
        console.error('Error fetching dashboard activities:', error)
        this.activities = []
      } finally {
        this.loading.activities = false
      }
    },

    // Fetch progress data
    async fetchProgress() {
      this.loading.progress = true

      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(`${API_BASE_URL}/dashboard/progress`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.data.success) {
          this.progressData = response.data.data
        } else {
          throw new Error(response.data.error || 'Failed to fetch progress data')
        }
      } catch (error) {
        console.error('Error fetching dashboard progress:', error)
        this.progressData = {
          overallProgress: 0,
          breakdown: []
        }
      } finally {
        this.loading.progress = false
      }
    },

    // Fetch participant dashboard data
    async fetchParticipantData() {
      this.loading.stats = true
      this.loading.activities = true
      this.loading.progress = true

      try {
        const token = localStorage.getItem('token')
        
        // Mock data for now since participant dashboard API isn't ready
        // TODO: Replace with actual API call to /api/participant/dashboard
        const mockData = {
          stats: {
            totalEnrollments: 0,
            completedTrainings: 0,
            upcomingTrainings: 0,
            availablePrograms: 2
          },
          activities: [
            {
              id: 1,
              type: 'registration',
              title: 'Akun berhasil dibuat',
              description: 'Selamat datang di SMY! Akun Anda telah berhasil dibuat.',
              timestamp: new Date().toISOString(),
              category: 'account'
            }
          ],
          progress: {
            overallProgress: 0,
            breakdown: []
          }
        }

        // Format data for participant dashboard
        this.stats = {
          totalParticipants: mockData.stats.totalEnrollments,
          activeTrainings: mockData.stats.upcomingTrainings,
          completedParticipants: mockData.stats.completedTrainings,
          pendingReview: mockData.stats.availablePrograms,
          participantTrend: 0,
          paymentStats: null // No payment stats for participants
        }

        this.activities = mockData.activities
        this.progressData = mockData.progress

      } catch (error) {
        console.error('Error fetching participant dashboard data:', error)
        this.error = error.message
      } finally {
        this.loading.stats = false
        this.loading.activities = false
        this.loading.progress = false
      }
    },

    // Fetch all dashboard data
    async fetchDashboardData() {
      const userRole = JSON.parse(localStorage.getItem('user') || '{}')?.role
      
      if (userRole === 'participant') {
        await this.fetchParticipantData()
      } else {
        await Promise.all([
          this.fetchStats(),
          this.fetchActivities(),
          this.fetchProgress()
        ])
      }
    },

    // Clear dashboard data (for logout)
    clearData() {
      this.stats = {
        totalParticipants: 0,
        activeTrainings: 0,
        completedParticipants: 0,
        pendingReview: 0,
        participantTrend: 0,
        paymentStats: null
      }
      this.activities = []
      this.progressData = {
        overallProgress: 0,
        breakdown: []
      }
      this.error = null
    }
  }
})