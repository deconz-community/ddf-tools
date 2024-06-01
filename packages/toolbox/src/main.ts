import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createApp } from 'vue'

import App from './App.vue'
import type { UserModule } from '~/types'

import generatedRoutes from '~pages'

const routes = setupLayouts(generatedRoutes)

const app = createApp(App)

;(function () {
  // From https://github.com/vuejs/router/issues/2054#issuecomment-2136520198
  // This function merges query parameters into the hash part of the URL for the Vue Router to work properly

  const location = window.location
  const path = location.pathname
  const searchParams = new URLSearchParams(location.search)
  const hash = location.hash

  // Check if there is a hash and query parameters
  if (hash && location.search) {
    const hashParts = hash.split('?')
    const hashBase = hashParts[0]
    const hashParams = new URLSearchParams(hashParts[1])

    // Merge the parameters
    searchParams.forEach((value, key) => {
      hashParams.set(key, value)
    })

    // Create a new URL with merged parameters
    const newHash = `${hashBase}?${hashParams.toString()}`
    const newUrl = `${path}${newHash}`

    // Redirect to the new URL if it's different from the current one
    if (newUrl !== location.href) {
      window.location.replace(newUrl)
    }
  }
})()

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})

app.use(router)

app.use(createAppMachine())

// install all modules under `modules/`
Object.values(import.meta.glob<{ install: UserModule }>('./modules/*.ts', { eager: true }))
  .forEach(i => i.install?.({ app, router }))

app.mount('#app')
