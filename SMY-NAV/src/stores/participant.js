import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { useAuthStore } from './auth'

const API_BASE_URL = 'http://localhost:3000/api'

export const useParticipantStore = defineStore('participant', () => {
  // State
  const participants = ref([])
  const trainingTypes = ref({})
  const currentParticipant = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const getParticipantById = computed(() => {
    return (id) => participants.value.find(p => p.id === id)
  })

  const getParticipantsByStatus = computed(() => {
    return (status) => participants.value.filter(p => p.status === status)
  })

  const totalParticipants = computed(() => participants.value.length)

  // Actions
  const fetchParticipants = async (params = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const authStore = useAuthStore()
      const token = authStore.token

      const queryParams = new URLSearchParams()
      
      if (params.page) queryParams.append('page', params.page)
      if (params.limit) queryParams.append('limit', params.limit)
      if (params.search) queryParams.append('search', params.search)
      if (params.trainingProgram) queryParams.append('trainingProgram', params.trainingProgram)
      if (params.status) queryParams.append('status', params.status)
      if (params.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)
      if (params.agencyOnly) queryParams.append('agencyOnly', params.agencyOnly)
      if (params.participantOnly) queryParams.append('participantOnly', params.participantOnly)

      const response = await axios.get(
        `${API_BASE_URL}/participants?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.success) {
        participants.value = response.data.data.participants
        return response.data.data
      } else {
        throw new Error(response.data.error?.message || 'Failed to fetch participants')
      }
    } catch (err) {
      error.value = err.response?.data?.error?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchParticipantById = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      const authStore = useAuthStore()
      const token = authStore.token

      const response = await axios.get(
        `${API_BASE_URL}/participants/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.success) {
        currentParticipant.value = response.data.data.participant
        return response.data.data.participant
      } else {
        throw new Error(response.data.error?.message || 'Failed to fetch participant')
      }
    } catch (err) {
      error.value = err.response?.data?.error?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const createParticipant = async (participantData) => {
    loading.value = true
    error.value = null
    
    try {
      const authStore = useAuthStore()
      const token = authStore.token

      // Create FormData for file uploads
      const formData = new FormData()
      
      // Add text fields
      Object.keys(participantData).forEach(key => {
        if (key !== 'files' && participantData[key] !== null && participantData[key] !== undefined) {
          formData.append(key, participantData[key])
        }
      })

      // Add files (similar to agency submission)
      if (participantData.files) {
        console.log('=== PARTICIPANT SELF-REGISTER DEBUG - Files to upload ===');
        Object.keys(participantData.files).forEach(fieldName => {
          const fileInput = participantData.files[fieldName]
          console.log(`Field: ${fieldName}`, fileInput);
          
          if (fileInput) {
            // Handle both FileList and Array cases
            let file = null;
            if (fileInput.length > 0) {
              file = fileInput[0]; // FileList or Array
            } else if (fileInput instanceof File) {
              file = fileInput; // Direct File object
            }
            
            if (file) {
              console.log(`Appending file for ${fieldName}:`, file.name, file.size);
              formData.append(fieldName, file);
            }
          }
        })
      }

      // Use different endpoint based on user role
      let endpoint = `${API_BASE_URL}/participants`
      if (authStore.user?.role === 'participant') {
        endpoint = `${API_BASE_URL}/participants/self-register`
      }

      const response = await axios.post(
        endpoint,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      if (response.data.success) {
        const result = response.data.data
        // Handle both single participant and multiple participants response
        if (result.participants) {
          // Multiple participants (self-registration)
          result.participants.forEach(participant => {
            participants.value.unshift(participant)
          })
          return {
            participants: result.participants,
            registrationNumber: result.registrationNumber,
            totalPrograms: result.totalPrograms
          }
        } else {
          // Single participant (agent creation)
          const newParticipant = result.participant
          participants.value.unshift(newParticipant)
          return newParticipant
        }
      } else {
        throw new Error(response.data.error?.message || 'Failed to create participant')
      }
    } catch (err) {
      error.value = err.response?.data?.error?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const createAgencySubmission = async (submissionData) => {
    loading.value = true
    error.value = null
    
    try {
      const authStore = useAuthStore()
      const token = authStore.token

      // Create FormData for file uploads
      const formData = new FormData()
      
      // Add participant's full name
      formData.append('fullName', submissionData.fullName || '')
      
      // Add training programs (convert array to JSON string)
      formData.append('trainingPrograms', JSON.stringify(submissionData.trainingPrograms))
      
      // Add BST certificate confirmation
      formData.append('hasBSTCertificate', submissionData.hasBSTCertificate || false)
      
      // Add payment option
      formData.append('paymentOption', submissionData.paymentOption)

      // Add files
      if (submissionData.files) {
        console.log('=== FRONTEND DEBUG - Files to upload ===');
        Object.keys(submissionData.files).forEach(fieldName => {
          const fileInput = submissionData.files[fieldName]
          console.log(`Field: ${fieldName}`, fileInput);
          
          if (fileInput) {
            // Handle both FileList and Array cases
            let file = null;
            if (fileInput.length > 0) {
              file = fileInput[0]; // FileList or Array
            } else if (fileInput instanceof File) {
              file = fileInput; // Direct File object
            }
            
            if (file) {
              console.log(`Appending file for ${fieldName}:`, file.name, file.size);
              formData.append(fieldName, file);
            }
          }
        })
      }

      const response = await axios.post(
        `${API_BASE_URL}/participants/agency-submission`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      if (response.data.success) {
        const { participants: newParticipants, summary } = response.data.data
        // Add all new participants to the store
        newParticipants.forEach(participant => {
          participants.value.unshift(participant)
        })
        // Return summary for UI feedback
        return {
          participants: newParticipants,
          summary,
          // For compatibility with existing UI expecting single participant
          registrationNumber: summary.registrationNumber,
          trainingPrograms: summary.trainingPrograms
        }
      } else {
        throw new Error(response.data.error?.message || 'Failed to create agency submission')
      }
    } catch (err) {
      error.value = err.response?.data?.error?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateParticipant = async (id, participantData) => {
    loading.value = true
    error.value = null
    
    try {
      const authStore = useAuthStore()
      const token = authStore.token

      let requestData

      // Check if participantData is already FormData
      if (participantData instanceof FormData) {
        requestData = participantData
      } else {
        // Create FormData for file uploads
        const formData = new FormData()
        
        // Add text fields
        Object.keys(participantData).forEach(key => {
          if (key !== 'files' && participantData[key] !== null && participantData[key] !== undefined) {
            formData.append(key, participantData[key])
          }
        })

        // Add files
        if (participantData.files) {
          Object.keys(participantData.files).forEach(fieldName => {
            const file = participantData.files[fieldName]
            if (file) {
              formData.append(fieldName, file)
            }
          })
        }
        
        requestData = formData
      }

      const response = await axios.put(
        `${API_BASE_URL}/participants/${id}`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      if (response.data.success) {
        const updatedParticipant = response.data.data.participant
        console.log('Updated participant from API:', updatedParticipant)
        const index = participants.value.findIndex(p => p.id === id)
        if (index !== -1) {
          participants.value[index] = updatedParticipant
        }
        currentParticipant.value = updatedParticipant
        return updatedParticipant
      } else {
        throw new Error(response.data.error?.message || 'Failed to update participant')
      }
    } catch (err) {
      error.value = err.response?.data?.error?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteParticipant = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      const authStore = useAuthStore()
      const token = authStore.token

      const response = await axios.delete(
        `${API_BASE_URL}/participants/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.success) {
        participants.value = participants.value.filter(p => p.id !== id)
        if (currentParticipant.value?.id === id) {
          currentParticipant.value = null
        }
        return true
      } else {
        throw new Error(response.data.error?.message || 'Failed to delete participant')
      }
    } catch (err) {
      error.value = err.response?.data?.error?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const submitParticipant = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      const authStore = useAuthStore()
      const token = authStore.token

      const response = await axios.put(
        `${API_BASE_URL}/participants/${id}/submit`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.success) {
        const updatedParticipant = response.data.data.participant
        // Update participant in local state
        const index = participants.value.findIndex(p => p.id === id)
        if (index !== -1) {
          participants.value[index] = updatedParticipant
        }
        if (currentParticipant.value?.id === id) {
          currentParticipant.value = updatedParticipant
        }
        return updatedParticipant
      } else {
        throw new Error(response.data.error?.message || 'Failed to submit participant')
      }
    } catch (err) {
      error.value = err.response?.data?.error?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchTrainingTypes = async () => {
    loading.value = true
    error.value = null
    
    try {
      const authStore = useAuthStore()
      const token = authStore.token

      const response = await axios.get(
        `${API_BASE_URL}/participants/training-types`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.success) {
        trainingTypes.value = response.data.data.trainingTypes
        return response.data.data.trainingTypes
      } else {
        throw new Error(response.data.error?.message || 'Failed to fetch training types')
      }
    } catch (err) {
      error.value = err.response?.data?.error?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateParticipantStatus = async (id, status) => {
    return updateParticipant(id, { status })
  }

  const updateParticipantProgress = async (id, progressData) => {
    return updateParticipant(id, progressData)
  }

  // Progress management methods for admin
  const verifyParticipant = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      const authStore = useAuthStore()
      const token = authStore.token

      const response = await axios.post(
        `${API_BASE_URL}/participants/${id}/verify`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.success) {
        // Update local participant data
        const index = participants.value.findIndex(p => p.id === id)
        if (index !== -1) {
          participants.value[index] = { ...participants.value[index], ...response.data.data }
        }
        return response.data.data
      } else {
        throw new Error(response.data.error?.message || 'Failed to verify participant')
      }
    } catch (err) {
      error.value = err.response?.data?.error?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const rejectParticipant = async (id, reason = '') => {
    loading.value = true
    error.value = null
    
    try {
      const authStore = useAuthStore()
      const token = authStore.token

      const response = await axios.post(
        `${API_BASE_URL}/participants/${id}/reject`,
        { reason },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.success) {
        // Update local participant data
        const index = participants.value.findIndex(p => p.id === id)
        if (index !== -1) {
          participants.value[index] = { ...participants.value[index], ...response.data.data }
        }
        return response.data.data
      } else {
        throw new Error(response.data.error?.message || 'Failed to reject participant')
      }
    } catch (err) {
      error.value = err.response?.data?.error?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const assignToBatch = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      const authStore = useAuthStore()
      const token = authStore.token

      const response = await axios.post(
        `${API_BASE_URL}/participants/${id}/assign-batch`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.success) {
        // Update local participant data
        const index = participants.value.findIndex(p => p.id === id)
        if (index !== -1) {
          participants.value[index] = { ...participants.value[index], ...response.data.data }
        }
        return response.data.data
      } else {
        throw new Error(response.data.error?.message || 'Failed to assign to batch')
      }
    } catch (err) {
      error.value = err.response?.data?.error?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const sendBatchToCenter = async (batchId) => {
    loading.value = true
    error.value = null
    
    try {
      const authStore = useAuthStore()
      const token = authStore.token

      const response = await axios.post(
        `${API_BASE_URL}/batches/${batchId}/send-to-center`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.error?.message || 'Failed to send batch to center')
      }
    } catch (err) {
      error.value = err.response?.data?.error?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const confirmDispatch = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      const authStore = useAuthStore()
      const token = authStore.token

      const response = await axios.post(
        `${API_BASE_URL}/participants/${id}/confirm-dispatch`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.success) {
        // Update local participant data
        const index = participants.value.findIndex(p => p.id === id)
        if (index !== -1) {
          participants.value[index] = { ...participants.value[index], ...response.data.data }
        }
        return response.data.data
      } else {
        throw new Error(response.data.error?.message || 'Failed to confirm dispatch')
      }
    } catch (err) {
      error.value = err.response?.data?.error?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const completeParticipant = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      const authStore = useAuthStore()
      const token = authStore.token

      const response = await axios.post(
        `${API_BASE_URL}/participants/${id}/complete`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.success) {
        // Update local participant data
        const index = participants.value.findIndex(p => p.id === id)
        if (index !== -1) {
          participants.value[index] = { ...participants.value[index], ...response.data.data }
        }
        return response.data.data
      } else {
        throw new Error(response.data.error?.message || 'Failed to complete participant')
      }
    } catch (err) {
      error.value = err.response?.data?.error?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateParticipantNotes = async (id, notes) => {
    return updateParticipant(id, { notes })
  }

  // Payment management methods
  const approvePayment = async (participantId, adminNotes = '') => {
    try {
      loading.value = true
      error.value = null

      const authStore = useAuthStore()
      const token = authStore.token

      const response = await axios.put(
        `${API_BASE_URL}/participants/${participantId}/payment/approve`,
        { adminNotes },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      // Update local participant if it exists
      const participantIndex = participants.value.findIndex(p => p.id === participantId)
      if (participantIndex !== -1) {
        participants.value[participantIndex] = response.data.participant
      }

      // Update currentParticipant if it's the same
      if (currentParticipant.value?.id === participantId) {
        currentParticipant.value = response.data.participant
      }

      return response.data
    } catch (err) {
      console.error('Error approving payment:', err)
      error.value = err.response?.data?.message || 'Failed to approve payment'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  const rejectPayment = async (participantId, adminNotes) => {
    try {
      loading.value = true
      error.value = null

      const authStore = useAuthStore()
      const token = authStore.token

      const response = await axios.put(
        `${API_BASE_URL}/participants/${participantId}/payment/reject`,
        { adminNotes },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      // Update local participant if it exists
      const participantIndex = participants.value.findIndex(p => p.id === participantId)
      if (participantIndex !== -1) {
        participants.value[participantIndex] = response.data.participant
      }

      // Update currentParticipant if it's the same
      if (currentParticipant.value?.id === participantId) {
        currentParticipant.value = response.data.participant
      }

      return response.data
    } catch (err) {
      console.error('Error rejecting payment:', err)
      error.value = err.response?.data?.message || 'Failed to reject payment'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  const fetchInvoices = async (params = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const authStore = useAuthStore()
      const token = authStore.token

      const queryParams = new URLSearchParams()
      
      if (params.page) queryParams.append('page', params.page)
      if (params.limit) queryParams.append('limit', params.limit)
      if (params.search) queryParams.append('search', params.search)
      if (params.paymentOption) queryParams.append('paymentOption', params.paymentOption)
      if (params.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus)
      if (params.trainingProgram) queryParams.append('trainingProgram', params.trainingProgram)
      if (params.agencyName) queryParams.append('agencyName', params.agencyName)
      if (params.startDate) queryParams.append('startDate', params.startDate)
      if (params.endDate) queryParams.append('endDate', params.endDate)
      if (params.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

      const response = await axios.get(
        `${API_BASE_URL}/invoices?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      return response.data
    } catch (err) {
      console.error('Error fetching invoices:', err)
      error.value = err.response?.data?.message || 'Failed to fetch invoices'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  const getPaymentHistory = async (participantId) => {
    try {
      loading.value = true
      error.value = null

      const authStore = useAuthStore()
      const token = authStore.token

      const response = await axios.get(
        `${API_BASE_URL}/participants/${participantId}/payment/history`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      return response.data
    } catch (err) {
      console.error('Error fetching payment history:', err)
      error.value = err.response?.data?.message || 'Failed to fetch payment history'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // Clear store data
  const clearParticipants = () => {
    participants.value = []
    currentParticipant.value = null
    error.value = null
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    participants,
    trainingTypes,
    currentParticipant,
    loading,
    error,
    
    // Getters
    getParticipantById,
    getParticipantsByStatus,
    totalParticipants,
    
    // Actions
    fetchParticipants,
    fetchParticipantById,
    createParticipant,
    createAgencySubmission,
    updateParticipant,
    deleteParticipant,
    submitParticipant,
    fetchTrainingTypes,
    updateParticipantStatus,
    updateParticipantProgress,
    
    // Progress management
    verifyParticipant,
    rejectParticipant,
    assignToBatch,
    sendBatchToCenter,
    confirmDispatch,
    completeParticipant,
    updateParticipantNotes,
    
    // Payment management
    approvePayment,
    rejectPayment,
    fetchInvoices,
    getPaymentHistory,
    
    // Utilities
    clearParticipants,
    clearError
  }
})