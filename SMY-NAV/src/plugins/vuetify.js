// plugins/vuetify.js
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

// Custom theme colors for SMY-NAV
const smyNavTheme = {
  dark: false,
  colors: {
    primary: '#1565C0', // Blue
    secondary: '#FFC107', // Amber
    accent: '#FF5722', // Deep Orange
    error: '#F44336',
    warning: '#FF9800',
    info: '#2196F3',
    success: '#4CAF50',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    'on-surface': '#1E1E1E',
    'on-primary': '#FFFFFF',
    'primary-darken-1': '#0D47A1',
    'secondary-darken-1': '#FF8F00',
  }
}

const smyNavDarkTheme = {
  dark: true,
  colors: {
    primary: '#42A5F5', // Light Blue
    secondary: '#FFD54F', // Light Amber
    accent: '#FF7043', // Light Deep Orange
    error: '#EF5350',
    warning: '#FFA726',
    info: '#42A5F5',
    success: '#66BB6A',
    background: '#121212',
    surface: '#1E1E1E',
    'on-surface': '#FFFFFF',
    'on-primary': '#000000',
    'primary-darken-1': '#1976D2',
    'secondary-darken-1': '#FFC107',
  }
}

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: smyNavTheme,
      dark: smyNavDarkTheme,
    },
  },
  defaults: {
    VCard: {
      elevation: 2,
    },
    VBtn: {
      style: 'text-transform: none;',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
    },
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable',
    },
  },
})