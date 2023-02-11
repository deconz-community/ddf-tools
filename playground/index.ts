import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHistory } from 'vue-router'
import { createApp } from 'vue'
// import { createWebHashHistory } from 'vue-router'
import App from './App.vue'

import generatedRoutes from '~pages'

import './styles/main.css'

const routes = setupLayouts(generatedRoutes)

const app = createApp(App)

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

app.use(router)

// install all modules under `modules/`

app.mount('#app')
