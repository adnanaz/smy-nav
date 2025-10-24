<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      app
      permanent
      :rail="rail"
      color="primary"
      dark
    >
      <template #prepend>
        <v-list-item
          :title="rail ? 'SMY' : 'SMY-NAV'"
          :subtitle="rail ? '' : 'Maritime Training System'"
          prepend-icon="mdi-anchor"
          class="mb-2"
        >
          <template #append>
            <v-btn
              variant="text"
              icon="mdi-chevron-left"
              @click.stop="rail = !rail"
            ></v-btn>
          </template>
        </v-list-item>
      </template>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item
          v-for="item in navigationItems"
          :key="item.title"
          :prepend-icon="item.icon"
          :title="item.title"
          :value="item.value"
          :to="item.to"
          :disabled="item.disabled"
        ></v-list-item>
      </v-list>

      <template #append>
        <div class="pa-2">
          <v-btn
            block
            variant="outlined"
            color="white"
            @click="handleLogout"
          >
            <v-icon start>mdi-logout</v-icon>
            <span v-if="!rail">Logout</span>
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar
      app
      color="white"
      elevation="1"
    >
      <v-app-bar-nav-icon @click="drawer = !drawer" class="d-md-none"></v-app-bar-nav-icon>
      
      <v-toolbar-title class="text-h6 font-weight-bold">
        {{ pageTitle }}
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <!-- Theme Toggle -->
      <v-btn
        icon
        @click="toggleTheme"
      >
        <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>

      <!-- Notifications -->
      <v-btn
        icon
        @click="showNotifications = true"
      >
        <v-badge
          :content="unreadNotifications"
          :model-value="unreadNotifications > 0"
          color="error"
        >
          <v-icon>mdi-bell</v-icon>
        </v-badge>
      </v-btn>

      <!-- Profile Menu -->
      <v-menu>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="text"
            class="ms-2"
          >
            <v-avatar size="32" color="primary">
              <span class="text-white">{{ userInitials }}</span>
            </v-avatar>
            <v-icon end>mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        
        <v-list>
          <v-list-item
            prepend-icon="mdi-account"
            title="Profile"
            @click="$router.push('/profile')"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-cog"
            title="Settings"
          ></v-list-item>
          <v-divider></v-divider>
          <v-list-item
            prepend-icon="mdi-logout"
            title="Logout"
            @click="handleLogout"
          ></v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <slot />
    </v-main>

    <!-- Notification Dialog -->
    <v-dialog v-model="showNotifications" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Notifications</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item
              v-for="notification in notifications"
              :key="notification.id"
              :prepend-icon="notification.icon"
              :title="notification.title"
              :subtitle="notification.message"
            ></v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showNotifications = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from 'vuetify'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  pageTitle: {
    type: String,
    default: 'SMY-NAV'
  }
})

const router = useRouter()
const authStore = useAuthStore()
const theme = useTheme()

// Reactive data
const drawer = ref(true)
const rail = ref(false)
const showNotifications = ref(false)
const unreadNotifications = ref(3)

// Sample notifications
const notifications = ref([
  {
    id: 1,
    icon: 'mdi-account-plus',
    title: 'New Participant',
    message: 'John Doe registered for BST training'
  },
  {
    id: 2,
    icon: 'mdi-check-circle',
    title: 'Training Completed',
    message: '5 participants completed SAT training'
  },
  {
    id: 3,
    icon: 'mdi-alert',
    title: 'Document Review',
    message: '3 documents pending verification'
  }
])

// Computed properties
const isDark = computed(() => theme.global.name.value === 'dark')

const userInitials = computed(() => {
  const name = authStore.userName
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
})

// Navigation items based on user role
const navigationItems = computed(() => {
  const baseItems = [
    { title: 'Dashboard', icon: 'mdi-view-dashboard', value: 'dashboard', to: '/dashboard' },
    { title: 'Participants', icon: 'mdi-account-group', value: 'participants', to: '/participants' },
    { title: 'Documents', icon: 'mdi-file-document', value: 'documents', to: '/documents', disabled: true },
    { title: 'Progress', icon: 'mdi-progress-check', value: 'progress', to: '/progress', disabled: true },
  ]

  if (authStore.isAdmin) {
    baseItems.push(
      { title: 'Users', icon: 'mdi-account-multiple', value: 'users', to: '/users', disabled: true }
    )
  }

  if (authStore.isSuperAdmin) {
    baseItems.push(
      { title: 'Agencies', icon: 'mdi-office-building', value: 'agencies', to: '/agencies', disabled: true },
      { title: 'System', icon: 'mdi-cog', value: 'system', to: '/system', disabled: true }
    )
  }

  return baseItems
})

// Methods
const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
  }
}
</script>

<style scoped>
.v-navigation-drawer {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.v-app-bar {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
</style>