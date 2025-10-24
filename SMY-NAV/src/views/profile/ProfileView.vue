<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card>
          <v-card-title>User Profile</v-card-title>
          <v-card-text>
            <div class="text-center mb-6">
              <v-avatar size="120" color="primary">
                <span class="text-h3 text-white">{{ userInitials }}</span>
              </v-avatar>
              <h2 class="text-h5 mt-4">{{ authStore.userName }}</h2>
              <p class="text-body-1 text-medium-emphasis">{{ authStore.userRole?.replace('_', ' ') }}</p>
            </div>
            
            <!-- Profile form will be implemented here -->
            <v-alert type="info" variant="tonal">
              Profile management features coming soon!
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const userInitials = computed(() => {
  const name = authStore.userName
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
})
</script>