<template>
  <v-app>
    <v-main>
      <!-- Hero Section -->
      <v-container fluid class="hero-section">
        <v-row align="center" justify="center" class="min-vh-100">
          <v-col cols="12" md="8" lg="6" class="text-center">
            <v-img
              src="/src/assets/logo.svg"
              alt="SMY-NAV Logo"
              max-width="150"
              class="mx-auto mb-8"
            ></v-img>
            
            <h1 class="text-h2 font-weight-bold text-primary mb-4">
              SMY-NAV
            </h1>
            
            <h2 class="text-h4 text-medium-emphasis mb-6">
              Sistem Manajemen Pelatihan Maritim
            </h2>
            
            <p class="text-h6 text-medium-emphasis mb-8 max-width-600 mx-auto">
              Platform terpadu untuk mengelola pelatihan pelaut, sertifikasi maritim, 
              dan monitoring progress peserta dari berbagai agensi pelayaran.
            </p>
            
            <div class="d-flex flex-column flex-sm-row gap-4 justify-center">
              <v-btn
                size="large"
                color="primary"
                variant="elevated"
                to="/login"
                prepend-icon="mdi-login"
              >
                Masuk ke Sistem
              </v-btn>
              
              <v-btn
                size="large"
                color="primary"
                variant="outlined"
                to="/register"
                prepend-icon="mdi-account-plus"
              >
                Daftar Akun Baru
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-container>
      
      <!-- Features Section -->
      <v-container class="py-16">
        <v-row>
          <v-col cols="12" class="text-center mb-8">
            <h3 class="text-h3 font-weight-bold mb-4">Fitur Unggulan</h3>
            <p class="text-h6 text-medium-emphasis">
              Solusi lengkap untuk manajemen pelatihan maritim yang profesional
            </p>
          </v-col>
        </v-row>
        
        <v-row>
          <v-col cols="12" md="6" lg="3" v-for="feature in features" :key="feature.title">
            <v-card class="feature-card h-100" elevation="2">
              <v-card-text class="text-center pa-8">
                <v-icon
                  :icon="feature.icon"
                  size="48"
                  color="primary"
                  class="mb-4"
                ></v-icon>
                
                <h4 class="text-h5 font-weight-bold mb-3">
                  {{ feature.title }}
                </h4>
                
                <p class="text-body-1 text-medium-emphasis">
                  {{ feature.description }}
                </p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
      
      <!-- Footer -->
      <v-footer class="bg-primary">
        <v-container>
          <v-row align="center" justify="center">
            <v-col cols="12" class="text-center">
              <p class="text-white mb-0">
                © 2025 SMY-NAV. Sistem Manajemen Pelatihan Maritim.
              </p>
            </v-col>
          </v-row>
        </v-container>
      </v-footer>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'

const features = ref([
  {
    icon: 'mdi-account-group',
    title: 'Multi-Agensi',
    description: 'Kelola berbagai agensi pelayaran dalam satu platform terpadu dengan sistem izin yang terstruktur.'
  },
  {
    icon: 'mdi-chart-line',
    title: 'Pelacakan Progress',
    description: 'Monitor kemajuan pelatihan peserta secara real-time dengan laporan yang detail dan akurat.'
  },
  {
    icon: 'mdi-file-document',
    title: 'Manajemen Dokumen',
    description: 'Simpan dan kelola dokumen pelatihan, sertifikat, dan berkas peserta dengan aman.'
  },
  {
    icon: 'mdi-clock-fast',
    title: 'Update Real-time',
    description: 'Dapatkan notifikasi dan update status pelatihan secara langsung tanpa delay.'
  }
])
</script>

<style scoped>
.hero-section {
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  min-height: 100vh;
}

.min-vh-100 {
  min-height: 100vh;
}

.max-width-600 {
  max-width: 600px;
}

.feature-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.gap-4 {
  gap: 1rem;
}
</style>
