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

      <v-list 
        density="compact" 
        nav
        v-model:opened="openGroups"
      >
        <!-- Dashboard -->
        <v-list-item
          prepend-icon="mdi-view-dashboard"
          title="Dashboard"
          value="dashboard"
          to="/dashboard"
          exact
        >
          <template #prepend>
            <v-icon>mdi-view-dashboard</v-icon>
          </template>
        </v-list-item>

        <!-- Participants (All roles) -->
        <v-list-item
          prepend-icon="mdi-account-group"
          :title="authStore.isParticipant ? 'Data Peserta' : 'Participants'"
          value="participants"
          to="/participants"
          exact
        >
          <template #prepend>
            <v-icon>mdi-account-group</v-icon>
          </template>
        </v-list-item>

        <!-- Daftar Diklat (Participant only) -->
        <v-list-item
          v-if="authStore.isParticipant"
          prepend-icon="mdi-plus-circle"
          title="Daftar Diklat"
          value="daftar-diklat"
          to="/daftar-diklat"
          exact
        >
          <template #prepend>
            <v-icon>mdi-plus-circle</v-icon>
          </template>
        </v-list-item>

        <!-- Admin Menu -->
        <v-list-group v-if="authStore.isAdmin" value="admin">
          <template v-slot:activator="{ props }">
            <v-list-item
              v-bind="props"
              prepend-icon="mdi-shield-account"
              title="Admin"
            >
              <template #prepend>
                <v-icon>mdi-shield-account</v-icon>
              </template>
            </v-list-item>
          </template>

          <v-list-item
            prepend-icon="mdi-receipt"
            title="Invoice Management"
            value="invoices"
            to="/admin/invoices"
            exact
          >
            <template #prepend>
              <v-icon>mdi-receipt</v-icon>
            </template>
          </v-list-item>

          <v-list-item
            prepend-icon="mdi-calendar-clock"
            title="Jadwal Pelatihan"
            value="schedules"
            to="/admin/schedules"
            exact
          >
            <template #prepend>
              <v-icon>mdi-calendar-clock</v-icon>
            </template>
          </v-list-item>

          <v-list-item
            prepend-icon="mdi-account-multiple"
            title="Users"
            value="users"
            to="/users"
            disabled
          >
            <template #prepend>
              <v-icon>mdi-account-multiple</v-icon>
            </template>
          </v-list-item>
        </v-list-group>



        <!-- Super Admin Menu -->
        <v-list-group v-if="authStore.isSuperAdmin" value="superadmin">
          <template v-slot:activator="{ props }">
            <v-list-item
              v-bind="props"
              prepend-icon="mdi-shield-crown"
              title="Super Admin"
            >
              <template #prepend>
                <v-icon>mdi-shield-crown</v-icon>
              </template>
            </v-list-item>
          </template>

          <v-list-item
            prepend-icon="mdi-office-building"
            title="Agencies"
            value="agencies"
            to="/agencies"
            disabled
          >
            <template #prepend>
              <v-icon>mdi-office-building</v-icon>
            </template>
          </v-list-item>

          <v-list-item
            prepend-icon="mdi-cog"
            title="System"
            value="system"
            to="/system"
            disabled
          >
            <template #prepend>
              <v-icon>mdi-cog</v-icon>
            </template>
          </v-list-item>
        </v-list-group>
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
          <!-- <v-list-item
            prepend-icon="mdi-cog"
            title="Settings"
          ></v-list-item> -->
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
import { useAuthStore } from '@/stores/auth-simple'

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
const openGroups = ref(['admin']) // Make admin group open by default

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
  const name = authStore.userName || 'User'
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
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

/* Ensure icons are always visible */
.v-list-item .v-icon {
  opacity: 1 !important;
}

.v-list-item--active .v-icon {
  opacity: 1 !important;
}

.v-list-item__prepend .v-icon {
  opacity: 1 !important;
}

/* Ensure text is visible */
.v-list-item__content {
  opacity: 1 !important;
}

.v-list-item--active .v-list-item__content {
  opacity: 1 !important;
}
</style>