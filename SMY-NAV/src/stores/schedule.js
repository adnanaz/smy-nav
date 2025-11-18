import { defineStore } from 'pinia'
import { api } from '@/utils/api'

export const useScheduleStore = defineStore('schedule', {
  state: () => ({
    schedules: [],
    activeSchedules: {},
    loading: false,
    error: null
  }),

  actions: {
    async getSchedules(params = {}) {
      this.loading = true
      this.error = null
      
      try {
        const response = await api.get('/schedules', { params })
        
        if (response.data.success) {
          this.schedules = response.data.data
          return response.data
        } else {
          throw new Error(response.data.error || 'Failed to fetch schedules')
        }
      } catch (error) {
        this.error = error.message || 'Failed to fetch schedules'
        throw error
      } finally {
        this.loading = false
      }
    },

    async getSchedule(id) {
      this.loading = true
      this.error = null
      
      try {
        const response = await api.get(`/schedules/${id}`)
        
        if (response.data.success) {
          return response.data.data
        } else {
          throw new Error(response.data.error || 'Failed to fetch schedule')
        }
      } catch (error) {
        this.error = error.message || 'Failed to fetch schedule'
        throw error
      } finally {
        this.loading = false
      }
    },

    async createSchedule(scheduleData) {
      this.loading = true
      this.error = null
      
      try {
        const response = await api.post('/schedules', scheduleData)
        
        if (response.data.success) {
          // Add to local state if needed
          this.schedules.unshift(response.data.data)
          return response.data.data
        } else {
          throw new Error(response.data.error || 'Failed to create schedule')
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to create schedule'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateSchedule(id, scheduleData) {
      this.loading = true
      this.error = null
      
      try {
        const response = await api.put(`/schedules/${id}`, scheduleData)
        
        if (response.data.success) {
          // Update local state
          const index = this.schedules.findIndex(s => s.id === id)
          if (index !== -1) {
            this.schedules[index] = response.data.data
          }
          return response.data.data
        } else {
          throw new Error(response.data.error || 'Failed to update schedule')
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to update schedule'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteSchedule(id) {
      this.loading = true
      this.error = null
      
      try {
        const response = await api.delete(`/schedules/${id}`)
        
        if (response.data.success) {
          // Remove from local state
          this.schedules = this.schedules.filter(s => s.id !== id)
          return true
        } else {
          throw new Error(response.data.error || 'Failed to delete schedule')
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to delete schedule'
        throw error
      } finally {
        this.loading = false
      }
    },

    async getActiveSchedule(trainingProgram) {
      this.loading = true
      this.error = null
      
      try {
        const response = await api.get(`/schedules/active/${trainingProgram}`)
        
        if (response.data.success) {
          // Cache active schedule
          this.activeSchedules[trainingProgram] = response.data.data
          return response.data.data
        } else {
          throw new Error(response.data.error || 'Failed to fetch active schedule')
        }
      } catch (error) {
        this.error = error.message || 'Failed to fetch active schedule'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Clear cached active schedules when new schedule is created/updated
    clearActiveScheduleCache() {
      this.activeSchedules = {}
    },

    // Get cached active schedule
    getCachedActiveSchedule(trainingProgram) {
      return this.activeSchedules[trainingProgram] || null
    },

    async searchParticipants(trainingProgram, searchTerm = '') {
      this.loading = true
      this.error = null
      
      try {
        const params = {
          trainingProgram,
          search: searchTerm
        }
        
        const response = await api.get('/participants/search', { params })
        
        if (response.data.success) {
          return response.data.data
        } else {
          throw new Error(response.data.error || 'Failed to search participants')
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to search participants'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})