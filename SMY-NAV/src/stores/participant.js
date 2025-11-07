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

      // Add files
      if (participantData.files) {
        Object.keys(participantData.files).forEach(fieldName => {
          const file = participantData.files[fieldName]
          if (file) {
            formData.append(fieldName, file)
          }
        })
      }

      const response = await axios.post(
        `${API_BASE_URL}/participants`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      if (response.data.success) {
        const newParticipant = response.data.data.participant
        participants.value.unshift(newParticipant)
        return newParticipant
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
      formData.append('paymentOption', submissionData.paymentOption || 'pay_later')

      // Add payment proof if provided
      if (submissionData.paymentProof) {
        console.log('=== FRONTEND DEBUG - Payment Proof ===');
        console.log('Payment proof file:', submissionData.paymentProof);
        formData.append('paymentProof', submissionData.paymentProof);
      }

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

      let formData
      
      // Check if participantData is already FormData (for file uploads from frontend)
      if (participantData instanceof FormData) {
        formData = participantData
      } else {
        // Create FormData for regular data updates
        formData = new FormData()
        
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
      }

      const response = await axios.put(
        `${API_BASE_URL}/participants/${id}`,
        formData,
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
    
    // Utilities
    clearParticipants,
    clearError
  }
})