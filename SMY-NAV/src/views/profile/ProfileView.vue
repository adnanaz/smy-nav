<template>
  <DashboardLayout page-title="Profile">
    <v-container fluid>
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <!-- Profile Info Card -->
          <v-card class="mb-6">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2" color="primary">mdi-account</v-icon>
              User Profile
            </v-card-title>
            <v-card-text>
              <div class="text-center mb-6">
                <v-avatar size="120" color="primary">
                  <span class="text-h3 text-white">{{ userInitials }}</span>
                </v-avatar>
                <h2 class="text-h5 mt-4">{{ profile.fullName || authStore.userName }}</h2>
                <p class="text-body-1 text-medium-emphasis">{{ formatRole(profile.role || authStore.userRole) }}</p>
                <v-chip 
                  v-if="profile.agency" 
                  color="info" 
                  variant="tonal" 
                  size="small" 
                  class="mt-2"
                >
                  {{ profile.agency.name }}
                </v-chip>
              </div>

              <!-- Profile Form -->
              <v-form ref="profileForm" v-model="profileValid" @submit.prevent="updateProfile">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="profileData.fullName"
                      label="Full Name"
                      prepend-inner-icon="mdi-account"
                      variant="outlined"
                      :rules="[rules.required]"
                      :loading="loading.profile"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="profileData.email"
                      label="Email"
                      type="email"
                      prepend-inner-icon="mdi-email"
                      variant="outlined"
                      :rules="[rules.required, rules.email]"
                      :loading="loading.profile"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="profile.username"
                      label="Username"
                      prepend-inner-icon="mdi-account-circle"
                      variant="outlined"
                      readonly
                      disabled
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      :model-value="formatRole(profile.role)"
                      label="Role"
                      prepend-inner-icon="mdi-shield-account"
                      variant="outlined"
                      readonly
                      disabled
                    />
                  </v-col>
                </v-row>

                <v-card-actions class="px-0">
                  <v-spacer />
                  <v-btn
                    type="submit"
                    color="primary"
                    :loading="loading.profile"
                    :disabled="!profileValid || !hasProfileChanges"
                  >
                    Update Profile
                  </v-btn>
                </v-card-actions>
              </v-form>
            </v-card-text>
          </v-card>

          <!-- Change Password Card -->
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2" color="warning">mdi-lock</v-icon>
              Change Password
            </v-card-title>
            <v-card-text>
              <v-form ref="passwordForm" v-model="passwordValid" @submit.prevent="updatePassword">
                <v-row>
                                    <v-col cols="12">
                    <v-text-field
                      v-model="passwordData.currentPassword"
                      label="Current Password *"
                      :type="showCurrentPassword ? 'text' : 'password'"
                      prepend-inner-icon="mdi-lock"
                      :append-inner-icon="showCurrentPassword ? 'mdi-eye' : 'mdi-eye-off'"
                      @click:append-inner="showCurrentPassword = !showCurrentPassword"
                      :rules="[rules.required]"
                      :loading="loading.password"
                      required
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="passwordData.newPassword"
                      label="New Password *"
                      :type="showNewPassword ? 'text' : 'password'"
                      prepend-inner-icon="mdi-lock-plus"
                      :append-inner-icon="showNewPassword ? 'mdi-eye' : 'mdi-eye-off'"
                      @click:append-inner="showNewPassword = !showNewPassword"
                      :rules="[rules.required, rules.minLength]"
                      :loading="loading.password"
                      required
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="passwordData.confirmPassword"
                      label="Confirm New Password *"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      prepend-inner-icon="mdi-lock-check"
                      :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                      @click:append-inner="showConfirmPassword = !showConfirmPassword"
                      :rules="[rules.required, rules.passwordMatch]"
                      :loading="loading.password"
                      required
                    />
                  </v-col>
                </v-row>

                <v-card-actions class="px-0">
                  <v-spacer />
                  <v-btn
                    variant="outlined"
                    @click="resetPasswordForm"
                    :disabled="loading.password"
                  >
                    Reset
                  </v-btn>
                  <v-btn
                    type="submit"
                    color="warning"
                    :loading="loading.password"
                    :disabled="!passwordValid"
                  >
                    Update Password
                  </v-btn>
                </v-card-actions>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Success Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="3000"
    >
      {{ snackbar.message }}
    </v-snackbar>
  </DashboardLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth-simple'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'

const authStore = useAuthStore()
import { API_BASE_URL } from '@/config/api.js'

// Reactive data
const profileValid = ref(false)
const passwordValid = ref(false)
const profileForm = ref(null)
const passwordForm = ref(null)

// Password visibility toggles
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const profile = ref({
  id: null,
  username: '',
  email: '',
  fullName: '',
  role: '',
  agency: null
})

const profileData = reactive({
  fullName: '',
  email: ''
})

const passwordData = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const loading = reactive({
  profile: false,
  password: false
})

const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Computed
const userInitials = computed(() => {
  const name = profile.value.fullName || authStore.userName || 'User'
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
})

const hasProfileChanges = computed(() => {
  return profileData.fullName !== profile.value.fullName ||
         profileData.email !== profile.value.email
})

// Validation rules
const rules = {
  required: (value) => !!value || 'Field is required',
  email: (value) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || 'Invalid email format'
  },
  minLength: (min) => (value) => {
    return (value && value.length >= min) || `Minimum ${min} characters required`
  },
  passwordMatch: (value) => {
    return value === passwordData.newPassword || 'Passwords do not match'
  }
}

// Methods
const formatRole = (role) => {
  if (!role) return ''
  return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const showSnackbar = (message, color = 'success') => {
  snackbar.value = {
    show: true,
    message,
    color
  }
}

const fetchProfile = async () => {
  loading.profile = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_BASE_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.data.success) {
      profile.value = response.data.data.user
      // Update form data
      profileData.fullName = profile.value.fullName || ''
      profileData.email = profile.value.email || ''
    }
  } catch (error) {
    console.error('Failed to fetch profile:', error)
    showSnackbar('Failed to load profile', 'error')
  } finally {
    loading.profile = false
  }
}

const updateProfile = async () => {
  if (!profileValid.value) return

  loading.profile = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.put(`${API_BASE_URL}/profile`, profileData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.data.success) {
      profile.value = response.data.data.user
      // Update auth store if needed
      if (profileData.fullName) {
        authStore.userName = profileData.fullName
      }
      showSnackbar('Profile updated successfully', 'success')
    }
  } catch (error) {
    console.error('Failed to update profile:', error)
    const errorMessage = error.response?.data?.error || 'Failed to update profile'
    showSnackbar(errorMessage, 'error')
  } finally {
    loading.profile = false
  }
}

const updatePassword = async () => {
  if (!passwordValid.value) return

  loading.password = true
  try {
    console.log('Updating password...', {
      hasCurrentPassword: !!passwordData.currentPassword,
      hasNewPassword: !!passwordData.newPassword
    })

    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No authentication token found')
    }

    // Send only required fields
    const requestData = {
      currentPassword: passwordData.currentPassword?.toString() || '',
      newPassword: passwordData.newPassword?.toString() || ''
    }

    console.log('Request data:', {
      hasCurrentPassword: !!requestData.currentPassword,
      hasNewPassword: !!requestData.newPassword,
      currentPasswordLength: requestData.currentPassword.length,
      newPasswordLength: requestData.newPassword.length
    })

    const response = await axios.put(`${API_BASE_URL}/profile/password`, requestData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('Password update response:', response.data)

    if (response.data.success) {
      // Reset password form
      passwordData.currentPassword = ''
      passwordData.newPassword = ''
      passwordData.confirmPassword = ''
      // Reset password visibility
      showCurrentPassword.value = false
      showNewPassword.value = false
      showConfirmPassword.value = false
      
      if (passwordForm.value) {
        passwordForm.value.resetValidation()
      }
      showSnackbar('Password updated successfully', 'success')
    }
  } catch (error) {
    console.error('Failed to update password:', error)
    console.error('Error response:', error.response?.data)
    const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'Failed to update password'
    showSnackbar(errorMessage, 'error')
  } finally {
    loading.password = false
  }
}

const resetPasswordForm = () => {
  passwordData.currentPassword = ''
  passwordData.newPassword = ''
  passwordData.confirmPassword = ''
  if (passwordForm.value) {
    passwordForm.value.resetValidation()
  }
}

// Lifecycle
onMounted(() => {
  fetchProfile()
})
</script>