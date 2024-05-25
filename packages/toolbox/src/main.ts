import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createApp } from 'vue'

import App from './App.vue'
import type { UserModule } from '~/types'

import generatedRoutes from '~pages'

const routes = setupLayouts(generatedRoutes)

const app = createApp(App)

const router = createRouter({
  // If removing hash history look in the code for "https://github.com/vuejs/router/issues/2054"
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})

app.use(router)

app.use(createAppMachine())

// install all modules under `modules/`
Object.values(import.meta.glob<{ install: UserModule }>('./modules/*.ts', { eager: true }))
  .forEach(i => i.install?.({ app, router }))

app.mount('#app')
