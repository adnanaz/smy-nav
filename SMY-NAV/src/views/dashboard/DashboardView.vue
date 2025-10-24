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
      <v-container fluid class="pa-6">
        <!-- Welcome Section -->
        <v-row class="mb-6">
          <v-col cols="12">
            <div class="d-flex align-center justify-space-between flex-wrap">
              <div>
                <h1 class="text-h4 font-weight-bold mb-2">
                  Welcome back, {{ authStore.userName }}!
                </h1>
                <p class="text-body-1 text-medium-emphasis">
                  {{ welcomeMessage }}
                </p>
              </div>
              <v-chip
                :color="roleColor"
                variant="elevated"
                class="text-capitalize"
              >
                <v-icon start>{{ roleIcon }}</v-icon>
                {{ authStore.userRole?.replace('_', ' ') }}
              </v-chip>
            </div>
          </v-col>
        </v-row>

        <!-- Stats Cards -->
        <v-row class="mb-6">
          <v-col
            v-for="stat in dashboardStats"
            :key="stat.title"
            cols="12"
            sm="6"
            md="3"
          >
            <v-card class="stat-card" height="140">
              <v-card-text class="d-flex align-center">
                <div class="flex-grow-1">
                  <p class="text-body-2 text-medium-emphasis mb-1">
                    {{ stat.title }}
                  </p>
                  <h3 class="text-h4 font-weight-bold mb-1">
                    {{ stat.value }}
                  </h3>
                  <div class="d-flex align-center">
                    <v-icon
                      :color="stat.trend > 0 ? 'success' : 'error'"
                      size="small"
                      class="me-1"
                    >
                      {{ stat.trend > 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}
                    </v-icon>
                    <span
                      :class="[
                        'text-caption',
                        stat.trend > 0 ? 'text-success' : 'text-error'
                      ]"
                    >
                      {{ Math.abs(stat.trend) }}% from last month
                    </span>
                  </div>
                </div>
                <v-avatar
                  :color="stat.color"
                  size="60"
                  class="ms-3"
                >
                  <v-icon color="white" size="30">{{ stat.icon }}</v-icon>
                </v-avatar>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Main Content Area -->
        <v-row>
          <!-- Recent Activities -->
          <v-col cols="12" md="8">
            <v-card class="mb-6">
              <v-card-title class="d-flex align-center justify-space-between">
                <span>Recent Activities</span>
                <v-btn variant="text" size="small">View All</v-btn>
              </v-card-title>
              <v-divider></v-divider>
              <v-card-text class="pa-0">
                <v-list lines="three">
                  <template v-for="(activity, index) in recentActivities" :key="index">
                    <v-list-item>
                      <template #prepend>
                        <v-avatar :color="activity.color" size="40">
                          <v-icon color="white">{{ activity.icon }}</v-icon>
                        </v-avatar>
                      </template>
                      <v-list-item-title>{{ activity.title }}</v-list-item-title>
                      <v-list-item-subtitle>{{ activity.description }}</v-list-item-subtitle>
                      <template #append>
                        <div class="text-caption text-medium-emphasis">
                          {{ activity.time }}
                        </div>
                      </template>
                    </v-list-item>
                    <v-divider v-if="index < recentActivities.length - 1"></v-divider>
                  </template>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Quick Actions -->
          <v-col cols="12" md="4">
            <v-card class="mb-6">
              <v-card-title>Quick Actions</v-card-title>
              <v-divider></v-divider>
              <v-card-text>
                <div class="d-flex flex-column ga-3">
                  <v-btn
                    v-for="action in quickActions"
                    :key="action.title"
                    :color="action.color"
                    :prepend-icon="action.icon"
                    variant="outlined"
                    block
                    @click="action.action"
                  >
                    {{ action.title }}
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>

            <!-- Progress Overview -->
            <v-card>
              <v-card-title>Training Progress</v-card-title>
              <v-divider></v-divider>
              <v-card-text>
                <div class="text-center mb-4">
                  <v-progress-circular
                    :model-value="overallProgress"
                    size="120"
                    width="12"
                    color="primary"
                  >
                    <span class="text-h4 font-weight-bold">{{ overallProgress }}%</span>
                  </v-progress-circular>
                  <p class="text-body-2 text-medium-emphasis mt-2">
                    Overall Completion Rate
                  </p>
                </div>
                
                <v-list density="compact">
                  <v-list-item
                    v-for="progress in progressBreakdown"
                    :key="progress.label"
                  >
                    <v-list-item-title class="text-body-2">
                      {{ progress.label }}
                    </v-list-item-title>
                    <template #append>
                      <div class="text-end">
                        <div class="text-body-2 font-weight-bold">
                          {{ progress.value }}%
                        </div>
                        <v-progress-linear
                          :model-value="progress.value"
                          :color="progress.color"
                          height="4"
                          class="mt-1"
                          style="width: 80px;"
                        ></v-progress-linear>
                      </div>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- Notifications Dialog -->
    <v-dialog
      v-model="showNotifications"
      max-width="500"
    >
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Notifications</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="showNotifications = false"
          ></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-0">
          <v-list>
            <v-list-item
              v-for="notification in notifications"
              :key="notification.id"
            >
              <template #prepend>
                <v-icon :color="notification.color">{{ notification.icon }}</v-icon>
              </template>
              <v-list-item-title>{{ notification.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ notification.message }}</v-list-item-subtitle>
              <template #append>
                <div class="text-caption">{{ notification.time }}</div>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from 'vuetify'

const router = useRouter()
const authStore = useAuthStore()
const theme = useTheme()

// Reactive data
const drawer = ref(true)
const rail = ref(false)
const showNotifications = ref(false)
const unreadNotifications = ref(3)

// Computed properties
const isDark = computed(() => theme.global.name.value === 'dark')
const pageTitle = computed(() => 'Dashboard')

const userInitials = computed(() => {
  const name = authStore.userName
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
})

const welcomeMessage = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning! Ready to start the day?'
  if (hour < 17) return 'Good afternoon! Keep up the great work!'
  return 'Good evening! Time to wrap up the day.'
})

const roleColor = computed(() => {
  const roleColors = {
    'super_admin': 'purple',
    'admin': 'primary',
    'agent': 'success'
  }
  return roleColors[authStore.userRole] || 'grey'
})

const roleIcon = computed(() => {
  const roleIcons = {
    'super_admin': 'mdi-crown',
    'admin': 'mdi-shield-account',
    'agent': 'mdi-account'
  }
  return roleIcons[authStore.userRole] || 'mdi-account'
})

// Navigation items based on user role
const navigationItems = computed(() => {
  const baseItems = [
    { title: 'Dashboard', icon: 'mdi-view-dashboard', value: 'dashboard', to: '/dashboard' },
    { title: 'Participants', icon: 'mdi-account-group', value: 'participants', to: '/participants' },
    { title: 'Documents', icon: 'mdi-file-document', value: 'documents', to: '/documents' },
    { title: 'Progress', icon: 'mdi-progress-check', value: 'progress', to: '/progress' },
  ]

  if (authStore.isAdmin) {
    baseItems.push(
      { title: 'Users', icon: 'mdi-account-multiple', value: 'users', to: '/users' }
    )
  }

  if (authStore.isSuperAdmin) {
    baseItems.push(
      { title: 'Agencies', icon: 'mdi-office-building', value: 'agencies', to: '/agencies' },
      { title: 'System', icon: 'mdi-cog', value: 'system', to: '/system' }
    )
  }

  return baseItems
})

// Dashboard statistics
const dashboardStats = ref([
  {
    title: 'Total Participants',
    value: '127',
    trend: 12,
    color: 'primary',
    icon: 'mdi-account-group'
  },
  {
    title: 'Active Training',
    value: '23',
    trend: 8,
    color: 'success',
    icon: 'mdi-school'
  },
  {
    title: 'Completed',
    value: '89',
    trend: 15,
    color: 'info',
    icon: 'mdi-check-circle'
  },
  {
    title: 'Pending Review',
    value: '15',
    trend: -5,
    color: 'warning',
    icon: 'mdi-clock-outline'
  }
])

// Recent activities
const recentActivities = ref([
  {
    title: 'New participant registered',
    description: 'Andi Setiawan joined Basic Safety Training program',
    time: '2 hours ago',
    icon: 'mdi-account-plus',
    color: 'success'
  },
  {
    title: 'Document verified',
    description: 'Medical certificate approved for Dewi Sartika',
    time: '4 hours ago',
    icon: 'mdi-file-check',
    color: 'info'
  },
  {
    title: 'Training completed',
    description: 'Bayu Pratama finished Ship Security Officer course',
    time: '1 day ago',
    icon: 'mdi-school',
    color: 'primary'
  },
  {
    title: 'Payment received',
    description: 'Training fee payment from PT. Maritime Solutions',
    time: '2 days ago',
    icon: 'mdi-cash',
    color: 'success'
  }
])

// Quick actions based on user role
const quickActions = computed(() => {
  const actions = [
    {
      title: 'Add Participant',
      icon: 'mdi-account-plus',
      color: 'primary',
      action: () => router.push('/participants/new')
    },
    {
      title: 'Upload Document',
      icon: 'mdi-file-upload',
      color: 'success',
      action: () => router.push('/documents/upload')
    }
  ]

  if (authStore.isAdmin) {
    actions.push({
      title: 'Generate Report',
      icon: 'mdi-chart-line',
      color: 'info',
      action: () => router.push('/reports')
    })
  }

  return actions
})

// Progress data
const overallProgress = ref(78)
const progressBreakdown = ref([
  { label: 'Documentation', value: 85, color: 'success' },
  { label: 'Medical Check', value: 72, color: 'info' },
  { label: 'Training', value: 68, color: 'warning' },
  { label: 'Certification', value: 45, color: 'error' }
])

// Notifications
const notifications = ref([
  {
    id: 1,
    title: 'Document Pending',
    message: 'Review required for medical certificate',
    time: '5 min ago',
    icon: 'mdi-file-alert',
    color: 'warning'
  },
  {
    id: 2,
    title: 'Training Complete',
    message: 'BST course finished by 3 participants',
    time: '1 hour ago',
    icon: 'mdi-school',
    color: 'success'
  },
  {
    id: 3,
    title: 'System Update',
    message: 'New features available in dashboard',
    time: '2 hours ago',
    icon: 'mdi-update',
    color: 'info'
  }
])

// Methods
const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

// Load dashboard data
const loadDashboardData = async () => {
  // TODO: Load real dashboard data from API
  console.log('Loading dashboard data...')
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.stat-card {
  transition: transform 0.2s ease-in-out;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.v-navigation-drawer {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.v-list-item--active {
  color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.1);
}
</style>