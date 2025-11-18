<template>
  <DashboardLayout page-title="Dashboard">
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
                <div class="grow">
                  <p class="text-body-2 text-medium-emphasis mb-1">
                    {{ stat.title }}
                  </p>
                  <h3 class="text-h4 font-weight-bold mb-1">
                    <v-skeleton-loader 
                      v-if="loading.stats" 
                      type="text" 
                      width="60px"
                    />
                    <span v-else>{{ stat.value }}</span>
                  </h3>
                  <div class="d-flex align-center" v-if="!loading.stats">
                    <v-icon
                      :color="stat.trend > 0 ? 'success' : stat.trend < 0 ? 'error' : 'grey'"
                      size="small"
                      class="me-1"
                    >
                      {{ stat.trend > 0 ? 'mdi-trending-up' : stat.trend < 0 ? 'mdi-trending-down' : 'mdi-minus' }}
                    </v-icon>
                    <span
                      :class="[
                        'text-caption',
                        stat.trend > 0 ? 'text-success' : stat.trend < 0 ? 'text-error' : 'text-grey'
                      ]"
                    >
                      {{ stat.trend === 0 ? 'No change' : `${Math.abs(stat.trend)}% from last month` }}
                    </span>
                  </div>
                  <v-skeleton-loader 
                    v-else 
                    type="text" 
                    width="120px"
                  />
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
        </v-row>      <!-- Main Content Area -->
      <v-row>
        <!-- Recent Activities -->
        <v-col cols="12" md="8">
          <v-card class="mb-6">
            <v-card-title class="d-flex align-center justify-space-between">
              <span>Recent Activities</span>
              <v-btn 
                variant="text" 
                size="small"
                @click="router.push('/participants')"
              >
                View All
              </v-btn>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text class="pa-0">
              <!-- Loading State -->
              <div v-if="loading.activities" class="pa-4">
                <v-skeleton-loader 
                  v-for="i in 4" 
                  :key="i" 
                  type="list-item-avatar-three-line"
                  class="mb-2"
                />
              </div>
              
              <!-- Activities List -->
              <v-list v-else-if="recentActivities.length > 0" lines="three">
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
              
              <!-- Empty State -->
              <div v-else class="text-center pa-8">
                <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-history</v-icon>
                <div class="text-h6 text-grey-darken-1 mb-2">No Recent Activities</div>
                <div class="text-body-2 text-grey-darken-1">
                  Activities will appear here as participants register and progress
                </div>
              </div>
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
              <!-- Loading State -->
              <div v-if="loading.progress" class="text-center mb-4">
                <v-skeleton-loader 
                  type="avatar" 
                  width="120" 
                  height="120"
                  class="mx-auto mb-4"
                />
                <v-skeleton-loader 
                  type="text" 
                  width="150"
                  class="mx-auto"
                />
              </div>
              
              <!-- Progress Data -->
              <div v-else class="text-center mb-4">
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
              
              <!-- Loading Breakdown -->
              <div v-if="loading.progress">
                <v-skeleton-loader 
                  v-for="i in 4" 
                  :key="i"
                  type="list-item"
                  class="mb-2"
                />
              </div>
              
              <!-- Progress Breakdown -->
              <v-list v-else-if="progressBreakdown.length > 0" density="compact">
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
              
              <!-- Empty Progress State -->
              <div v-else class="text-center pa-4">
                <v-icon size="48" color="grey-lighten-2" class="mb-2">mdi-chart-line</v-icon>
                <div class="text-body-2 text-grey-darken-1">
                  No progress data available
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

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
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth-simple'
import { useDashboardStore } from '@/stores/dashboard'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'

const router = useRouter()
const authStore = useAuthStore()
const dashboardStore = useDashboardStore()

// Reactive data
const showNotifications = ref(false)

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
    'agent': 'success',
    'participant': 'info'
  }
  return roleColors[authStore.userRole] || 'grey'
})

const roleIcon = computed(() => {
  const roleIcons = {
    'super_admin': 'mdi-crown',
    'admin': 'mdi-shield-account',
    'agent': 'mdi-account',
    'participant': 'mdi-school'
  }
  return roleIcons[authStore.userRole] || 'mdi-account'
})

// Dashboard data from store
const dashboardStats = computed(() => dashboardStore.dashboardStats)
const recentActivities = computed(() => dashboardStore.activities)
const overallProgress = computed(() => dashboardStore.progressData.overallProgress)
const progressBreakdown = computed(() => dashboardStore.progressData.breakdown)
const loading = computed(() => dashboardStore.loading)



// Quick actions based on user role
const quickActions = computed(() => {
  const actions = []

  // Agent actions
  if (authStore.isAgent) {
    actions.push(
      {
        title: 'Add Participant',
        icon: 'mdi-account-plus',
        color: 'primary',
        action: () => router.push('/participants/create')
      },
      {
        title: 'View My Participants',
        icon: 'mdi-account-group',
        color: 'info',
        action: () => router.push('/participants')
      }
    )
  }

  // Admin actions
  if (authStore.isAdmin) {
    actions.push(
      {
        title: 'Manage Participants',
        icon: 'mdi-account-group',
        color: 'primary',
        action: () => router.push('/participants')
      },
      {
        title: 'Invoice Management',
        icon: 'mdi-receipt',
        color: 'success',
        action: () => router.push('/admin/invoices')
      },
      {
        title: 'Schedule Training',
        icon: 'mdi-calendar-plus',
        color: 'warning',
        action: () => router.push('/admin/schedules')
      },
      {
        title: 'Generate Report',
        icon: 'mdi-chart-line',
        color: 'info',
        action: () => {} // TODO: Implement reports
      }
    )
  }

  // Participant actions  
  if (authStore.userRole === 'participant') {
    actions.push(
      {
        title: 'Browse Training Programs',
        icon: 'mdi-book-open-variant',
        color: 'primary',
        action: () => {} // TODO: Implement training catalog
      },
      {
        title: 'My Training Progress',
        icon: 'mdi-progress-check',
        color: 'info',
        action: () => {} // TODO: Implement progress view
      },
      {
        title: 'Certificates',
        icon: 'mdi-certificate',
        color: 'success',
        action: () => {} // TODO: Implement certificates view
      },
      {
        title: 'Update Profile',
        icon: 'mdi-account-edit',
        color: 'warning',
        action: () => router.push('/profile')
      }
    )
  }

  return actions
})



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

// Load dashboard data
const loadDashboardData = async () => {
  try {
    await dashboardStore.fetchDashboardData()
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
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
</style>