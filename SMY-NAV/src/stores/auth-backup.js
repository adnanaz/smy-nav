// stores/auth.js
import { defineStore } from 'pinia'
import { authAPI } from '@/services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token && !!state.user,
    userRole: (state) => state.user?.role || null,
    userAgency: (state) => state.user?.agency || null,
    userName: (state) => state.user?.fullName || state.user?.username || 'User',
    isAdmin: (state) => ['super_admin', 'admin'].includes(state.user?.role),
    isSuperAdmin: (state) => state.user?.role === 'super_admin',
    isAgent: (state) => state.user?.role === 'agent',
    hasPermission: (state) => (requiredRole) => {
      if (!state.user) return false
      
      const roleHierarchy = {
        'super_admin': 3,
        'admin': 2,
        'agent': 1
      }
      
      const userLevel = roleHierarchy[state.user.role] || 0
      const requiredLevel = roleHierarchy[requiredRole] || 0
      
      return userLevel >= requiredLevel
    }
  },

  actions: {
    // Set authentication token
    setToken(token) {
      console.log('Setting token:', !!token)
      this.token = token
      if (token) {
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('token')
      }
    },

    // Set user data
    setUser(user) {
      console.log('Setting user data:', user)
      this.user = user
      this.isAuthenticated = !!user
      if (user) {
        localStorage.setItem('user', JSON.stringify(user))
      } else {
        localStorage.removeItem('user')
      }
    },

    // Set error
    setError(error) {
      this.error = error
    },

    // Clear error
    clearError() {
      this.error = null
    },

    // Login action
    async login(credentials) {
      this.isLoading = true
      this.clearError()

      try {
        const response = await authAPI.login(credentials)
        
        if (response.data.success) {
          const { token, user } = response.data.data
          this.setToken(token)
          this.setUser(user)
          
          return { success: true, user }
        } else {
          throw new Error(response.data.error?.message || 'Login gagal')
        }
      } catch (error) {
        let errorMessage = 'Login gagal'
        
        if (error.response?.data?.error?.message) {
          // Translate common error messages
          const msg = error.response.data.error.message
          if (msg.includes('Invalid credentials') || msg.includes('Invalid email or password')) {
            errorMessage = 'Email atau kata sandi tidak valid'
          } else if (msg.includes('User not found')) {
            errorMessage = 'Pengguna tidak ditemukan'
          } else if (msg.includes('Account is inactive')) {
            errorMessage = 'Akun tidak aktif'
          } else {
            errorMessage = msg
          }
        }
        
        this.setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        this.isLoading = false
      }
    },

    // Register action
    async register(userData) {
      this.isLoading = true
      this.clearError()

      try {
        const response = await authAPI.register(userData)
        
        if (response.data.success) {
          const { token, user } = response.data.data
          this.setToken(token)
          this.setUser(user)
          
          return { success: true, user }
        } else {
          throw new Error(response.data.error?.message || 'Registrasi gagal')
        }
      } catch (error) {
        let errorMessage = 'Registrasi gagal'
        
        if (error.response?.data?.error?.message) {
          const msg = error.response.data.error.message
          if (msg.includes('Email already exists') || msg.includes('already registered')) {
            errorMessage = 'Email sudah terdaftar'
          } else if (msg.includes('Validation failed')) {
            errorMessage = 'Data tidak valid'
          } else {
            errorMessage = msg
          }
        }
        
        this.setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        this.isLoading = false
      }
    },

    // Get current user
    async getCurrentUser() {
      if (!this.token) {
        return { success: false, error: 'Token tidak tersedia' }
      }

      this.isLoading = true
      this.clearError()

      try {
        const response = await authAPI.getProfile()
        
        if (response.data.success) {
          const { user } = response.data.data
          this.setUser(user)
          
          return { success: true, user }
        } else {
          throw new Error(response.data.error?.message || 'Gagal mengambil data pengguna')
        }
      } catch (error) {
        let errorMessage = 'Gagal mengambil data pengguna'
        
        if (error.response?.data?.error?.message) {
          errorMessage = error.response.data.error.message
        }
        
        this.setError(errorMessage)
        
        // If unauthorized, clear auth data
        if (error.response?.status === 401) {
          this.logout()
        }
        
        return { success: false, error: errorMessage }
      } finally {
        this.isLoading = false
      }
    },

    // Update password
    async updatePassword(passwordData) {
      this.isLoading = true
      this.clearError()

      try {
        const response = await authAPI.changePassword(passwordData)
        
        if (response.data.success) {
          return { success: true, message: 'Kata sandi berhasil diubah' }
        } else {
          throw new Error(response.data.error?.message || 'Gagal mengubah kata sandi')
        }
      } catch (error) {
        let errorMessage = 'Gagal mengubah kata sandi'
        
        if (error.response?.data?.error?.message) {
          const msg = error.response.data.error.message
          if (msg.includes('Current password is incorrect')) {
            errorMessage = 'Kata sandi saat ini salah'
          } else if (msg.includes('Password too weak')) {
            errorMessage = 'Kata sandi terlalu lemah'
          } else {
            errorMessage = msg
          }
        }
        
        this.setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        this.isLoading = false
      }
    },

    // Logout action
    async logout() {
      this.isLoading = true

      try {
        // Call logout endpoint if token exists
        if (this.token) {
          await authAPI.logout()
        }
      } catch (error) {
        // Even if logout fails, we should clear local auth data
        console.error('Logout error:', error)
      } finally {
        // Clear all auth data
        this.setToken(null)
        this.setUser(null)
        this.clearError()
        this.isLoading = false
        this.isAuthenticated = false
        
        // Also clear localStorage
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        
        console.log('Logout completed, all auth data cleared')
      }
    },

    // Initialize auth state from stored token
    async initializeAuth() {
      console.log('Initializing auth state...')
      
      // Try to restore user from localStorage first
      const storedUser = localStorage.getItem('user')
      if (storedUser && !this.user) {
        try {
          this.user = JSON.parse(storedUser)
          this.isAuthenticated = true
          console.log('Restored user from localStorage:', this.user.email)
        } catch (error) {
          console.error('Error parsing stored user:', error)
          localStorage.removeItem('user')
        }
      }
      
      if (this.token) {
        // Verify token is still valid by fetching current user
        const result = await this.getCurrentUser()
        if (!result.success) {
          console.log('Token invalid during initialization, logging out')
          // If failed, clear invalid token
          this.logout()
        } else {
          console.log('Auth state initialized successfully')
        }
      }
    },

    // Check if user has permission
    hasPermission(requiredRole) {
      if (!this.user) return false
      
      const roleHierarchy = {
        'super_admin': 3,
        'admin': 2,
        'agent': 1
      }
      
      const userLevel = roleHierarchy[this.user.role] || 0
      const requiredLevel = roleHierarchy[requiredRole] || 0
      
      return userLevel >= requiredLevel
    },

    // Check if user can access agency data
    canAccessAgency(agencyId) {
      if (!this.user) return false
      if (this.isSuperAdmin) return true
      return this.user.agencyId === agencyId
    }
  }
})