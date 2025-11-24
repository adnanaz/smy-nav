<template>
  <v-app>
    <v-main>
      <v-container fluid class="pa-0">
        <v-row no-gutters class="min-vh-100">
          <!-- Left Side - Branding (Hidden on mobile) -->
          <v-col
            cols="12"
            md="6"
            lg="6"
            xl="12"
            class="d-none d-md-flex align-center justify-center position-relative"
          >
            <div class="login-brand-background"></div>
            <div class="login-brand-content text-center">
              <v-img
                src="/src/assets/logo.svg"
                alt="SMY-NAV Logo"
                max-width="120"
                class="mb-6 mx-auto"
              ></v-img>
              <h1 class="text-h3 font-weight-bold text-white mb-4">
                SMY-NAV
              </h1>
              <p class="text-h6 text-white mb-6 opacity-90">
                Sistem Manajemen Pelatihan Maritim
              </p>
              <div class="feature-highlights">
                <v-chip
                  v-for="feature in features"
                  :key="feature"
                  color="rgba(255,255,255,0.2)"
                  text-color="white"
                  class="ma-1"
                  size="small"
                >
                  <v-icon start size="small">mdi-check</v-icon>
                  {{ feature }}
                </v-chip>
              </div>
            </div>
          </v-col>

          <!-- Right Side - Login Form -->
          <v-col
            cols="12"
            md="6"
            lg="6"
            xl="5"
            class="d-flex align-center justify-center pa-4"
          >
            <v-card
              class="login-card elevation-8"
              max-width="500"
              width="100%"
            >
              <v-card-text class="pa-10">
                <!-- Mobile Logo -->
                <div class="text-center mb-6 d-md-none">
                  <v-img
                    src="/src/assets/logo.svg"
                    alt="SMY-NAV Logo"
                    max-width="80"
                    class="mx-auto mb-4"
                  ></v-img>
                  <h2 class="text-h5 font-weight-bold primary--text">
                    SMY-NAV
                  </h2>
                  <p class="text-caption text-medium-emphasis">
                    Sistem Manajemen Pelatihan Maritim
                  </p>
                </div>

                <!-- Login Header -->
                <div class="text-center mb-6">
                  <h2 class="text-h4 font-weight-bold mb-2">
                    Selamat Datang Kembali
                  </h2>
                  <p class="text-body-1 text-medium-emphasis">
                    Masuk ke akun Anda untuk melanjutkan
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

                <!-- Test Credentials removed for production -->

                <!-- Login Form -->
                <v-form
                  ref="loginForm"
                  v-model="valid"
                  @submit.prevent="handleLogin"
                  lazy-validation
                >
                  <v-text-field
                    v-model="loginData.email"
                    label="Alamat Email"
                    type="email"
                    prepend-inner-icon="mdi-email"
                    :rules="emailRules"
                    :disabled="authStore.isLoading"
                    autocomplete="email"
                    class="mb-3"
                    variant="outlined"
                  ></v-text-field>

                  <v-text-field
                    v-model="loginData.password"
                    label="Kata Sandi"
                    :type="showPassword ? 'text' : 'password'"
                    prepend-inner-icon="mdi-lock"
                    :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    :rules="passwordRules"
                    :disabled="authStore.isLoading"
                    autocomplete="current-password"
                    class="mb-4"
                    variant="outlined"
                    @click:append-inner="showPassword = !showPassword"
                    @keyup.enter="handleLogin"
                  ></v-text-field>

                  <div class="d-flex justify-space-between align-center mb-6">
                    <v-checkbox
                      v-model="rememberMe"
                      label="Ingat saya"
                      density="compact"
                      hide-details
                    ></v-checkbox>
                    
                    <v-btn
                      variant="text"
                      size="small"
                      color="primary"
                      @click="showForgotPassword = true"
                    >
                      Lupa Kata Sandi?
                    </v-btn>
                  </div>

                  <v-btn
                    type="button"
                    block
                    size="large"
                    color="primary"
                    :loading="authStore.isLoading"
                    :disabled="!valid || authStore.isLoading"
                    class="mb-4"
                    @click="handleLogin"
                  >
                    <v-icon start>mdi-login</v-icon>
                    Masuk
                  </v-btn>
                </v-form>

                <!-- Divider -->
                <v-divider class="my-6">
                  <span class="text-medium-emphasis px-4">atau</span>
                </v-divider>

                <!-- Register Link -->
                <div class="text-center">
                  <p class="text-body-2 text-medium-emphasis mb-2">
                    Belum punya akun?
                  </p>
                  <v-btn
                    variant="outlined"
                    color="primary"
                    block
                    @click="$router.push('/register')"
                  >
                    Buat Akun Baru
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>

      <!-- Forgot Password Dialog -->
      <v-dialog
        v-model="showForgotPassword"
        max-width="500"
      >
        <v-card>
          <v-card-title>
            <span class="text-h5">Reset Kata Sandi</span>
          </v-card-title>
          <v-card-text>
            <v-text-field
              v-model="forgotPasswordEmail"
              label="Alamat Email"
              type="email"
              prepend-inner-icon="mdi-email"
              :rules="emailRules"
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              text
              @click="showForgotPassword = false"
            >
              Batal
            </v-btn>
            <v-btn
              color="primary"
              @click="handleForgotPassword"
            >
              Kirim Link Reset
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Form data
const loginData = reactive({
  email: '',
  password: ''
})

// Form state
const valid = ref(false)
const showPassword = ref(false)
const rememberMe = ref(false)
const showForgotPassword = ref(false)
const forgotPasswordEmail = ref('')
const loginForm = ref(null)

// Features to highlight
const features = [
  'Manajemen Multi-Agensi',
  'Pelacakan Progress',
  'Manajemen Dokumen',
  'Update Real-time'
]

// Validation rules
const emailRules = [
  v => !!v || 'Email wajib diisi',
  v => /.+@.+\..+/.test(v) || 'Email harus valid'
]

const passwordRules = [
  v => !!v || 'Kata sandi wajib diisi',
  v => v.length >= 6 || 'Kata sandi minimal 6 karakter'
]

// Handle login
const handleLogin = async () => {
  console.log('Login attempt started...') // Debug log
  
  // Validate form first
  const formValid = await loginForm.value?.validate()
  if (!formValid?.valid) {
    console.log('Form validation failed')
    return
  }

  console.log('Attempting login with:', { email: loginData.email, password: '***' })
  
  try {
    const result = await authStore.login(loginData)
    
    console.log('Login result:', result)
    
    if (result.success) {
      console.log('Login successful, redirecting...')
      // Redirect to intended page or dashboard
      const redirectTo = route.query.redirect || '/dashboard'
      await router.push(redirectTo)
    } else {
      console.log('Login failed:', result.error)
    }
  } catch (error) {
    console.error('Login error:', error)
    authStore.setError('Terjadi kesalahan saat login. Silakan coba lagi.')
  }
}

// Quick fill test credentials
const fillTestCredentials = (type) => {
  if (type === 'admin') {
    loginData.email = 'admin@smy-nav.com'
    loginData.password = 'password123'
  } else if (type === 'agency') {
    loginData.email = 'admin@maritime-solutions.com'
    loginData.password = 'password123'
  }
}

// Handle forgot password
const handleForgotPassword = () => {
  // TODO: Implement forgot password functionality
  console.log('Reset password untuk:', forgotPasswordEmail.value)
  showForgotPassword.value = false
  
  // Show success message
  authStore.setError('Link reset kata sandi telah dikirim ke email Anda')
}
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}

.login-brand-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1565C0 0%, #42A5F5 50%, #FFC107 100%);
  opacity: 0.95;
}

.login-brand-content {
  position: relative;
  z-index: 1;
  max-width: 500px;
  padding: 2rem;
}

.feature-highlights {
  max-width: 400px;
  margin: 0 auto;
}

.login-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  min-width: 400px;
}

@media (max-width: 960px) {
  .login-card {
    margin: 1rem;
    border-radius: 12px;
    min-width: auto;
    max-width: 100% !important;
  }
}

@media (min-width: 1200px) {
  .login-card {
    max-width: 550px !important;
  }
}

@media (min-width: 1400px) {
  .login-card {
    max-width: 600px !important;
  }
}

/* Custom scrollbar for webkit browsers */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>