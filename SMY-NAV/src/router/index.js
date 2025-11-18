import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth-simple'

// Import views
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/auth/LoginView.vue'
import RegisterView from '../views/auth/RegisterView.vue'
import DashboardView from '../views/dashboard/DashboardView.vue'
import ParticipantView from '../views/dashboard/ParticipantView.vue'
import ParticipantCreateView from '../views/participants/ParticipantCreateView.vue'
import DaftarDiklatView from '../views/participants/DaftarDiklatView.vue'
import ProfileView from '../views/profile/ProfileView.vue'
import InvoiceView from '../views/admin/InvoiceView.vue'
import ScheduleView from '../views/admin/ScheduleView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { 
      title: 'SMY-NAV - Sistem Manajemen Pelatihan Maritim',
      requiresAuth: false,
      redirectIfAuth: true // Will redirect to dashboard if authenticated
    }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { 
      title: 'Login - SMY-NAV',
      requiresAuth: false,
      hideForAuth: true // Hide for authenticated users
    }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { 
      title: 'Daftar - SMY',
      requiresAuth: false,
      hideForAuth: true
    }
  },

  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { 
      title: 'Dashboard - SMY-NAV',
      requiresAuth: true 
    }
  },

  {
    path: '/participants',
    name: 'participants',
    component: ParticipantView,
    meta: { 
      title: 'Peserta - SMY-NAV',
      requiresAuth: true
    }
  },
  {
    path: '/participants/create',
    name: 'participant-create',
    component: ParticipantCreateView,
    meta: { 
      title: 'Tambah Peserta - SMY-NAV',
      requiresAuth: true,
      requiresRole: ['super_admin', 'admin', 'agent']
    }
  },
  {
    path: '/daftar-diklat',
    name: 'daftar-diklat',
    component: DaftarDiklatView,
    meta: { 
      title: 'Daftar Diklat - SMY-NAV',
      requiresAuth: true,
      requiresRole: ['participant']
    }
  },
  {
    path: '/admin/invoices',
    name: 'admin-invoices',
    component: InvoiceView,
    meta: { 
      title: 'Invoice Management - SMY-NAV',
      requiresAuth: true,
      requiresRole: ['super_admin', 'admin']
    }
  },
  {
    path: '/admin/schedules',
    name: 'admin-schedules',
    component: ScheduleView,
    meta: { 
      title: 'Schedule Management - SMY-NAV',
      requiresAuth: true,
      requiresRole: ['super_admin', 'admin']
    }
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { 
      title: 'Profile - SMY-NAV',
      requiresAuth: true 
    }
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutView.vue'),
    meta: { 
      title: 'About - SMY-NAV',
      requiresAuth: false 
    }
  },
  // Catch-all 404 route
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { 
      title: 'Page Not Found - SMY-NAV',
      requiresAuth: false 
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation Guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Set page title
  document.title = to.meta.title || 'SMY-NAV'
  
  // Initialize auth if not already done and we have a token
  if (authStore.token && !authStore.user) {
    console.log('Initializing auth state...')
    await authStore.initializeAuth()
  }
  
  // Debug logging with more details
  console.log('Router Guard Debug:', {
    to: to.name,
    from: from.name,
    isLoggedIn: authStore.isLoggedIn,
    hasUser: !!authStore.user,
    hasToken: !!authStore.token,
    isAuthenticated: authStore.isAuthenticated,
    requiresAuth: to.meta.requiresAuth,
    hideForAuth: to.meta.hideForAuth,
    userRole: authStore.user?.role
  })
  
  // Force check token validity
  if (authStore.token && !authStore.user) {
    console.log('Token exists but no user data, trying to fetch user...')
    const result = await authStore.getCurrentUser()
    if (!result.success) {
      console.log('Token invalid, clearing auth state')
      authStore.logout()
    }
  }
  
  // Helper function to get appropriate dashboard route based on role
  const getDashboardRoute = () => {
    // All users use the same dashboard now, just with different data
    return 'dashboard'
  }

  // Check if route should be hidden for authenticated users (login, register pages)
  if (to.meta.hideForAuth && authStore.isLoggedIn) {
    console.log('🔄 Redirecting authenticated user from', to.name, 'to dashboard')
    next({ name: getDashboardRoute() })
    return
  }
  
  // Check if home route should redirect authenticated users
  if (to.meta.redirectIfAuth && authStore.isLoggedIn) {
    console.log('🔄 Redirecting authenticated user from home to dashboard')
    next({ name: getDashboardRoute() })
    return
  }

  // No need to redirect dashboard anymore - all roles use same dashboard
  
  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    console.log('🔒 Redirecting unauthenticated user to login')
    // Redirect to login with return url
    next({ 
      name: 'login', 
      query: { redirect: to.fullPath }
    })
    return
  }
  
  // Check role-based access
  if (to.meta.requiresRole && !authStore.hasPermission(to.meta.requiresRole)) {
    console.log('❌ Insufficient permissions, redirecting to dashboard')
    // Redirect to dashboard with error
    next({ 
      name: 'dashboard', 
      query: { error: 'insufficient_permissions' }
    })
    return
  }
  
  console.log('✅ Route access granted for', to.name)
  next()
})

export default router
