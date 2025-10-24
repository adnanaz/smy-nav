import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify.js'

// Create app
const app = createApp(App)

// Create pinia store
const pinia = createPinia()

// Use plugins
app.use(pinia)
app.use(router)
app.use(vuetify)

app.mount('#app')
