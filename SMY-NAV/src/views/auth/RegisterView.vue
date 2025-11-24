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
                alt="SMY Logo"
                max-width="120"
                class="mb-6 mx-auto"
              ></v-img>
              <h1 class="text-h3 font-weight-bold text-white mb-4">
                Selamat Datang di SMY
              </h1>
              <p class="text-h6 text-white mb-6 opacity-90">
                Platform Pelatihan Profesional Terdepan
              </p>
              <v-list class="bg-transparent">
                <v-list-item class="text-white mb-2">
                  <template v-slot:prepend>
                    <v-icon color="white" class="me-3">mdi-check-circle</v-icon>
                  </template>
                  <v-list-item-title>Pelatihan Berkualitas Internasional</v-list-item-title>
                </v-list-item>
                <v-list-item class="text-white mb-2">
                  <template v-slot:prepend>
                    <v-icon color="white" class="me-3">mdi-check-circle</v-icon>
                  </template>
                  <v-list-item-title>Sertifikat Resmi Terakreditasi</v-list-item-title>
                </v-list-item>
                <v-list-item class="text-white mb-2">
                  <template v-slot:prepend>
                    <v-icon color="white" class="me-3">mdi-check-circle</v-icon>
                  </template>
                  <v-list-item-title>Instruktur Berpengalaman</v-list-item-title>
                </v-list-item>
                <v-list-item class="text-white">
                  <template v-slot:prepend>
                    <v-icon color="white" class="me-3">mdi-check-circle</v-icon>
                  </template>
                  <v-list-item-title>Fasilitas Training Modern</v-list-item-title>
                </v-list-item>
              </v-list>
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
                    alt="SMY Logo"
                    max-width="60"
                    class="mx-auto mb-3"
                  ></v-img>
                  <h2 class="text-h6 font-weight-bold text-primary">
                    Daftar Pelatihan SMY
                  </h2>
                </div>

                <!-- Register Header -->
                <div class="text-center mb-6">
                  <h2 class="text-h4 font-weight-bold text-primary mb-2">
                    Daftar Sekarang
                  </h2>
                  <p class="text-body-1 text-grey">
                    Mulai perjalanan pembelajaran profesional Anda bersama SMY
                  </p>
                </div>

                                <!-- Error Alert -->
                <v-alert
                  v-if="errorMessage"
                  type="error"
                  variant="tonal"
                  class="mb-4"
                  closable
                  @click:close="errorMessage = ''"
                >
                  {{ errorMessage }}
                </v-alert>

                <!-- Register Form -->
                <v-form
                  ref="registerForm"
                  v-model="valid"
                  @submit.prevent="handleRegister"
                >
                  <!-- Nama Lengkap -->
                  <v-text-field
                    v-model="registerData.fullName"
                    label="Nama Lengkap"
                    prepend-inner-icon="mdi-account-outline"
                    :rules="fullNameRules"
                    :disabled="loading"
                    variant="outlined"
                    class="mb-3"
                    required
                  ></v-text-field>

                  <!-- Email -->
                  <v-text-field
                    v-model="registerData.email"
                    label="Email"
                    type="email"
                    prepend-inner-icon="mdi-email-outline"
                    :rules="emailRules"
                    :disabled="loading"
                    variant="outlined"
                    class="mb-3"
                    required
                  ></v-text-field>

                  <!-- Nomor HP -->
                  <v-text-field
                    v-model="registerData.phone"
                    label="Nomor HP"
                    prepend-inner-icon="mdi-phone-outline"
                    :rules="phoneRules"
                    :disabled="loading"
                    variant="outlined"
                    class="mb-3"
                    placeholder="08xxxxxxxxxx"
                    required
                  ></v-text-field>

                  <!-- Dari mana mengetahui SMY -->
                  <v-select
                    v-model="registerData.source"
                    :items="sourceOptions"
                    label="Dari mana Anda mengetahui SMY?"
                    prepend-inner-icon="mdi-information-outline"
                    :rules="sourceRules"
                    :disabled="loading"
                    variant="outlined"
                    class="mb-3"
                    required
                  ></v-select>

                  <!-- Password -->
                  <v-text-field
                    v-model="registerData.password"
                    label="Password"
                    :type="showPassword ? 'text' : 'password'"
                    prepend-inner-icon="mdi-lock-outline"
                    :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    :rules="passwordRules"
                    :disabled="loading"
                    variant="outlined"
                    class="mb-3"
                    @click:append-inner="showPassword = !showPassword"
                    required
                  ></v-text-field>

                  <!-- Confirm Password -->
                  <v-text-field
                    v-model="confirmPassword"
                    label="Konfirmasi Password"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    prepend-inner-icon="mdi-lock-check-outline"
                    :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    :rules="confirmPasswordRules"
                    :disabled="loading"
                    variant="outlined"
                    class="mb-4"
                    @click:append-inner="showConfirmPassword = !showConfirmPassword"
                    required
                  ></v-text-field>

                  <!-- Captcha -->
                  <div class="mb-4">
                    <h3 class="text-body-1 font-weight-medium mb-3">
                      <v-icon class="me-2">mdi-shield-check</v-icon>
                      Verifikasi Keamanan
                    </h3>
                    <SimpleCaptcha
                      ref="captchaRef"
                      @captcha-valid="onCaptchaValid"
                    />
                  </div>

                  <!-- Privacy Policy -->
                  <v-checkbox
                    v-model="acceptTerms"
                    :rules="termsRules"
                    class="mb-4"
                    required
                  >
                    <template v-slot:label>
                      <span class="text-body-2">
                        Saya setuju dengan 
                        <a href="#" class="text-primary text-decoration-none">
                          Syarat & Ketentuan
                        </a> 
                        dan 
                        <a href="#" class="text-primary text-decoration-none">
                          Kebijakan Privasi
                        </a>
                      </span>
                    </template>
                  </v-checkbox>

                  <!-- Submit Button -->
                  <v-btn
                    type="submit"
                    block
                    size="large"
                    color="primary"
                    :loading="loading"
                    :disabled="!valid || !captchaValid"
                    class="mb-4"
                  >
                    <v-icon class="me-2">mdi-account-plus</v-icon>
                    Daftar Sekarang
                  </v-btn>
                </v-form>

                <!-- Login Link -->
                <div class="text-center">
                  <span class="text-body-2 text-grey">
                    Sudah punya akun? 
                    <router-link 
                      to="/login" 
                      class="text-primary text-decoration-none font-weight-medium"
                    >
                      Masuk di sini
                    </router-link>
                  </span>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- Success Dialog -->
    <v-dialog v-model="showSuccessDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="text-center pa-6">
          <v-icon size="64" color="success" class="mb-4">mdi-check-circle</v-icon>
          <h3 class="text-h5 font-weight-bold">Registrasi Berhasil!</h3>
        </v-card-title>
        <v-card-text class="text-center pb-6">
          <p class="text-body-1 mb-4">
            Selamat datang di SMY, <strong>{{ registerData.fullName }}</strong>!
          </p>
          <p class="text-body-2 text-grey">
            Akun Anda telah berhasil dibuat. Silakan login untuk mengakses dashboard 
            dan melihat informasi pelatihan yang tersedia.
          </p>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-btn
            color="primary"
            block
            size="large"
            @click="goToLogin"
          >
            Masuk ke Dashboard
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import SimpleCaptcha from '@/components/SimpleCaptcha.vue'
import axios from 'axios'

const router = useRouter()

// Configure axios base URL
import { API_BASE_URL } from '@/config/api.js'
axios.defaults.baseURL = API_BASE_URL.replace('/api', '')

// Form data
const registerData = reactive({
  fullName: '',
  email: '',
  phone: '',
  source: '',
  password: ''
})

// Form state
const valid = ref(false)
const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const confirmPassword = ref('')
const acceptTerms = ref(false)
const captchaValid = ref(false)
const errorMessage = ref('')
const showSuccessDialog = ref(false)
const registerForm = ref(null)
const captchaRef = ref(null)

// Source options
const sourceOptions = [
  'WhatsApp',
  'Instagram', 
  'Facebook',
  'LinkedIn',
  'Website SMY',
  'Google Search',
  'Referral Teman',
  'Referral Perusahaan',
  'Brosur/Flyer',
  'Pameran/Event',
  'Lainnya'
]

// Validation rules
const fullNameRules = [
  v => !!v || 'Nama lengkap wajib diisi',
  v => (v && v.length >= 3) || 'Nama minimal 3 karakter',
  v => (v && v.length <= 100) || 'Nama maksimal 100 karakter'
]

const emailRules = [
  v => !!v || 'Email wajib diisi',
  v => /.+@.+\..+/.test(v) || 'Format email tidak valid'
]

const phoneRules = [
  v => !!v || 'Nomor HP wajib diisi',
  v => /^(\+62|62|0)[0-9]{9,13}$/.test(v.replace(/[\s-]/g, '')) || 'Format nomor HP tidak valid'
]

const sourceRules = [
  v => !!v || 'Sumber informasi wajib dipilih'
]

const passwordRules = [
  v => !!v || 'Password wajib diisi',
  v => (v && v.length >= 6) || 'Password minimal 6 karakter',
  v => /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(v) || 'Password harus mengandung huruf besar, huruf kecil, dan angka'
]

const confirmPasswordRules = [
  v => !!v || 'Konfirmasi password wajib diisi',
  v => v === registerData.password || 'Password tidak cocok'
]

const termsRules = [
  v => !!v || 'Anda harus menyetujui syarat dan ketentuan'
]

// Captcha handlers
const onCaptchaValid = (isValid) => {
  captchaValid.value = isValid
}

// Navigate to login
const goToLogin = () => {  
  showSuccessDialog.value = false
  router.push('/login')
}

// Handle registration
const handleRegister = async () => {
  if (!valid.value || !captchaValid.value) return

  loading.value = true
  errorMessage.value = ''
  
  try {
    const response = await axios.post('/api/auth/register-participant', {
      fullName: registerData.fullName,
      email: registerData.email,
      phone: registerData.phone,
      source: registerData.source,
      password: registerData.password,
      // These fields are required by backend but will be filled with defaults
      birthDate: new Date(1990, 0, 1).toISOString().split('T')[0], // Default birthdate
      occupation: 'Tidak disebutkan',
      company: 'Tidak disebutkan',
      interestedProgram: 'Pelatihan Umum'
    })

    if (response.data.success) {
      // Show success dialog
      showSuccessDialog.value = true
      
      // Reset form
      registerData.fullName = ''
      registerData.email = ''
      registerData.phone = ''
      registerData.source = ''
      registerData.password = ''
      confirmPassword.value = ''
      acceptTerms.value = false
      captchaRef.value?.resetCaptcha()
    }
  } catch (error) {
    console.error('Registration error:', error)
    
    // Handle validation errors
    if (error.response?.data?.error?.details) {
      const errors = error.response.data.error.details
      errorMessage.value = errors.map(e => e.msg).join(', ')
    } else {
      errorMessage.value = error.response?.data?.error?.message || 'Terjadi kesalahan saat registrasi. Silakan coba lagi.'
    }
    
    // Reset captcha on error
    captchaRef.value?.resetCaptcha()
  } finally {
    loading.value = false
  }
}
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
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
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

/* Smooth transitions */
.v-btn {
  transition: all 0.3s ease;
}

.v-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
}

/* Form section spacing */
.v-form > div {
  margin-bottom: 16px;
}

@media (max-width: 960px) {
  .register-card {
    margin: 1rem;
    border-radius: 12px;
    height: 100vh;
    overflow-y: auto;
  }
}
</style>