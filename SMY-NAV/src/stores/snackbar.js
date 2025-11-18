import { defineStore } from 'pinia'

export const useSnackbarStore = defineStore('snackbar', {
  state: () => ({
    show: false,
    message: '',
    color: 'info', // success, error, warning, info
    timeout: 5000,
    multiLine: false
  }),

  actions: {
    showSnackbar(message, color = 'info', options = {}) {
      this.message = message
      this.color = color
      this.timeout = options.timeout || 5000
      this.multiLine = options.multiLine || false
      this.show = true
    },

    // Convenience methods
    success(message, options = {}) {
      this.showSnackbar(message, 'success', options)
    },

    error(message, options = {}) {
      this.showSnackbar(message, 'error', options)
    },

    warning(message, options = {}) {
      this.showSnackbar(message, 'warning', options)
    },

    info(message, options = {}) {
      this.showSnackbar(message, 'info', options)
    },

    hide() {
      this.show = false
    },

    // For backward compatibility with existing code
    show(message, color = 'info', options = {}) {
      this.showSnackbar(message, color, options)
    }
  }
})