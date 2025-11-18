<template>
  <v-app>
    <router-view />
    
    <!-- Global Snackbar -->
    <v-snackbar
      v-model="snackbarStore.show"
      :color="snackbarStore.color"
      :timeout="snackbarStore.timeout"
      :multi-line="snackbarStore.multiLine"
      location="top right"
    >
      {{ snackbarStore.message }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="snackbarStore.hide()"
          icon="mdi-close"
          size="small"
        />
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSnackbarStore } from '@/stores/snackbar'

const authStore = useAuthStore()
const snackbarStore = useSnackbarStore()

// Initialize authentication state when app loads
onMounted(async () => {
  await authStore.initializeAuth()
})
</script>

<style>
/* Global styles */
html {
  scroll-behavior: smooth;
}

/* Custom scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
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

/* Vuetify custom theme adjustments */
.v-application {
  font-family: 'Roboto', sans-serif !important;
}

.v-btn {
  text-transform: none !important;
}

/* Animation utilities */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(-100%);
}

.slide-leave-to {
  transform: translateX(100%);
}
</style>
