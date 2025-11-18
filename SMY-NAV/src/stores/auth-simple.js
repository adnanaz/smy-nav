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
    isParticipant: (state) => state.user?.role === 'participant',
    hasPermission: (state) => (requiredRoles) => {
      if (!state.user) return false
      
      // Handle both single role and array of roles
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
      
      // Check if user's role is in the required roles list
      return roles.includes(state.user.role)
    }
  },

  actions: {
    // Set authentication token
    setToken(token) {
      this.token = token
      if (token) {
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('token')
      }
    },

    // Set user data
    setUser(user) {
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
      console.log('Auth store login called with:', credentials)
      this.isLoading = true
      this.clearError()

      try {
        const response = await authAPI.login(credentials)
        console.log('Login API response:', response.data)
        
        if (response.data.success) {
          const { token, user } = response.data.data
          this.setToken(token)
          this.setUser(user)
          
          console.log('Login successful, user set:', user)
          return { success: true, user }
        } else {
          throw new Error(response.data.error?.message || 'Login gagal')
        }
      } catch (error) {
        console.error('Login error:', error)
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
      }
    },

    // Initialize auth state from stored token
    async initializeAuth() {
      console.log('Initializing auth state...')
      
      // First try to restore user from localStorage
      const storedUser = localStorage.getItem('user')
      if (storedUser && this.token) {
        try {
          this.user = JSON.parse(storedUser)
          this.isAuthenticated = true
          console.log('Restored user from localStorage:', this.user)
          return { success: true, user: this.user }
        } catch (error) {
          console.error('Error parsing stored user:', error)
          localStorage.removeItem('user')
        }
      }
      
      // If we have a token but no user, try to get current user
      if (this.token && !this.user) {
        console.log('Token exists but no user, fetching from API...')
        const result = await this.getCurrentUser()
        return result
      }
      
      console.log('No token or user found')
      return { success: false, error: 'No authentication data' }
    },
  },
})