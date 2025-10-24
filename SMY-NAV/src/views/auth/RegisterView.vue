<template>
  <v-app>
    <v-main>
      <v-container fluid class="pa-0">
        <v-row no-gutters class="min-vh-100">
          <!-- Left Side - Branding (Hidden on mobile) -->
          <v-col
            cols="12"
            md="5"
            lg="6"
            class="d-none d-md-flex align-center justify-center position-relative"
          >
            <div class="register-brand-background"></div>
            <div class="register-brand-content text-center">
              <v-img
                src="/src/assets/logo.svg"
                alt="SMY-NAV Logo"
                max-width="100"
                class="mb-4 mx-auto"
              ></v-img>
              <h1 class="text-h4 font-weight-bold text-white mb-3">
                Join SMY-NAV
              </h1>
              <p class="text-body-1 text-white mb-4 opacity-90">
                Start managing maritime training efficiently
              </p>
            </div>
          </v-col>

          <!-- Right Side - Register Form -->
          <v-col
            cols="12"
            md="7"
            lg="6"
            class="d-flex align-center justify-center pa-4"
          >
            <v-card
              class="register-card elevation-8"
              max-width="500"
              width="100%"
            >
              <v-card-text class="pa-6">
                <!-- Mobile Logo -->
                <div class="text-center mb-4 d-md-none">
                  <v-img
                    src="/src/assets/logo.svg"
                    alt="SMY-NAV Logo"
                    max-width="60"
                    class="mx-auto mb-3"
                  ></v-img>
                  <h2 class="text-h6 font-weight-bold primary--text">
                    SMY-NAV Registration
                  </h2>
                </div>

                <!-- Register Header -->
                <div class="text-center mb-4">
                  <h2 class="text-h5 font-weight-bold mb-2">
                    Create Account
                  </h2>
                  <p class="text-body-2 text-medium-emphasis">
                    Fill in the details below to get started
                  </p>
                </div>

                <!-- Error Alert -->
                <v-alert
                  v-if="authStore.error"
                  type="error"
                  variant="tonal"
                  class="mb-4"
                  closable
                  @click:close="authStore.clearError()"
                >
                  {{ authStore.error }}
                </v-alert>

                <!-- Register Form -->
                <v-form
                  ref="registerForm"
                  v-model="valid"
                  @submit.prevent="handleRegister"
                >
                  <v-row>
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="registerData.username"
                        label="Username"
                        prepend-inner-icon="mdi-account"
                        :rules="usernameRules"
                        :disabled="authStore.isLoading"
                        autocomplete="username"
                        class="mb-2"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="registerData.fullName"
                        label="Full Name"
                        prepend-inner-icon="mdi-account-circle"
                        :rules="fullNameRules"
                        :disabled="authStore.isLoading"
                        autocomplete="name"
                        class="mb-2"
                      ></v-text-field>
                    </v-col>
                  </v-row>

                  <v-text-field
                    v-model="registerData.email"
                    label="Email Address"
                    type="email"
                    prepend-inner-icon="mdi-email"
                    :rules="emailRules"
                    :disabled="authStore.isLoading"
                    autocomplete="email"
                    class="mb-2"
                  ></v-text-field>

                  <v-select
                    v-model="registerData.role"
                    :items="roleOptions"
                    label="Role"
                    prepend-inner-icon="mdi-shield-account"
                    :rules="roleRules"
                    :disabled="authStore.isLoading"
                    class="mb-2"
                  ></v-select>

                  <v-select
                    v-if="registerData.role && registerData.role !== 'super_admin'"
                    v-model="registerData.agencyId"
                    :items="agencyOptions"
                    label="Agency"
                    prepend-inner-icon="mdi-office-building"
                    :rules="agencyRules"
                    :disabled="authStore.isLoading"
                    :loading="loadingAgencies"
                    class="mb-2"
                  ></v-select>

                  <v-text-field
                    v-model="registerData.password"
                    :label="'Password'"
                    :type="showPassword ? 'text' : 'password'"
                    prepend-inner-icon="mdi-lock"
                    :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    :rules="passwordRules"
                    :disabled="authStore.isLoading"
                    autocomplete="new-password"
                    class="mb-2"
                    @click:append-inner="showPassword = !showPassword"
                  ></v-text-field>

                  <v-text-field
                    v-model="confirmPassword"
                    :label="'Confirm Password'"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    prepend-inner-icon="mdi-lock-check"
                    :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    :rules="confirmPasswordRules"
                    :disabled="authStore.isLoading"
                    autocomplete="new-password"
                    class="mb-3"
                    @click:append-inner="showConfirmPassword = !showConfirmPassword"
                  ></v-text-field>

                  <v-checkbox
                    v-model="acceptTerms"
                    :rules="termsRules"
                    density="compact"
                    class="mb-4"
                  >
                    <template #label>
                      <span class="text-body-2">
                        I agree to the 
                        <a href="#" class="text-primary text-decoration-none">Terms of Service</a>
                        and 
                        <a href="#" class="text-primary text-decoration-none">Privacy Policy</a>
                      </span>
                    </template>
                  </v-checkbox>

                  <v-btn
                    type="submit"
                    block
                    size="large"
                    color="primary"
                    :loading="authStore.isLoading"
                    :disabled="!valid"
                    class="mb-4"
                  >
                    Create Account
                  </v-btn>
                </v-form>

                <!-- Divider -->
                <v-divider class="my-4">
                  <span class="text-medium-emphasis px-4">or</span>
                </v-divider>

                <!-- Login Link -->
                <div class="text-center">
                  <p class="text-body-2 text-medium-emphasis mb-2">
                    Already have an account?
                  </p>
                  <v-btn
                    variant="outlined"
                    color="primary"
                    block
                    @click="$router.push('/login')"
                  >
                    Sign In
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Form data
const registerData = reactive({
  username: '',
  fullName: '',
  email: '',
  password: '',
  role: '',
  agencyId: null
})

// Form state
const valid = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const confirmPassword = ref('')
const acceptTerms = ref(false)
const registerForm = ref(null)
const loadingAgencies = ref(false)
const agencies = ref([])

// Role options
const roleOptions = [
  { title: 'Super Admin', value: 'super_admin' },
  { title: 'Agency Admin', value: 'admin' },
  { title: 'Agent', value: 'agent' }
]

// Computed properties
const agencyOptions = computed(() => 
  agencies.value.map(agency => ({
    title: agency.name,
    value: agency.id
  }))
)

// Validation rules
const usernameRules = [
  v => !!v || 'Username is required',
  v => v.length >= 3 || 'Username must be at least 3 characters',
  v => /^[a-zA-Z0-9_]+$/.test(v) || 'Username can only contain letters, numbers, and underscores'
]

const fullNameRules = [
  v => !!v || 'Full name is required',
  v => v.length >= 2 || 'Full name must be at least 2 characters'
]

const emailRules = [
  v => !!v || 'Email is required',
  v => /.+@.+\..+/.test(v) || 'Email must be valid'
]

const roleRules = [
  v => !!v || 'Role is required'
]

const agencyRules = [
  v => registerData.role === 'super_admin' || !!v || 'Agency is required'
]

const passwordRules = [
  v => !!v || 'Password is required',
  v => v.length >= 6 || 'Password must be at least 6 characters',
  v => /(?=.*[a-z])/.test(v) || 'Password must contain at least one lowercase letter',
  v => /(?=.*[A-Z])/.test(v) || 'Password must contain at least one uppercase letter',
  v => /(?=.*\d)/.test(v) || 'Password must contain at least one number'
]

const confirmPasswordRules = [
  v => !!v || 'Please confirm your password',
  v => v === registerData.password || 'Passwords do not match'
]

const termsRules = [
  v => !!v || 'You must accept the terms and conditions'
]

// Watch role changes to reset agency selection
watch(() => registerData.role, (newRole) => {
  if (newRole === 'super_admin') {
    registerData.agencyId = null
  }
})

// Load agencies
const loadAgencies = async () => {
  loadingAgencies.value = true
  try {
    // TODO: Replace with actual API call
    // const response = await axios.get('/agencies')
    // agencies.value = response.data.data
    
    // Mock data for now
    agencies.value = [
      { id: '550e8400-e29b-41d4-a716-446655440001', name: 'PT. Maritime Solutions' },
      { id: '550e8400-e29b-41d4-a716-446655440002', name: 'CV. Ocean Careers' },
      { id: '550e8400-e29b-41d4-a716-446655440003', name: 'PT. Pelaut Nusantara' }
    ]
  } catch (error) {
    console.error('Failed to load agencies:', error)
  } finally {
    loadingAgencies.value = false
  }
}

// Handle registration
const handleRegister = async () => {
  if (!valid.value) return

  const userData = { ...registerData }
  if (userData.role === 'super_admin') {
    delete userData.agencyId
  }

  const result = await authStore.register(userData)
  
  if (result.success) {
    // Redirect to dashboard
    router.push('/dashboard')
  }
}

// Load agencies on component mount
onMounted(() => {
  loadAgencies()
})
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}

.register-brand-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #42A5F5 0%, #1565C0 50%, #FFC107 100%);
  opacity: 0.95;
}

.register-brand-content {
  position: relative;
  z-index: 1;
  max-width: 400px;
  padding: 2rem;
}

.register-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

@media (max-width: 960px) {
  .register-card {
    margin: 1rem;
    border-radius: 12px;
  }
}
</style>