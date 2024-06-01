<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router'

import { useTheme } from 'vuetify'

const app = useAppMachine('app')
const store = useStore()
const storeUrl = useRouteQuery('storeUrl', '')

if (storeUrl.value)
  app.send({ type: 'UPDATE_SETTINGS', settings: { developerMode: true } })

function updateStoreUrl() {
  store.send({ type: 'UPDATE_DIRECTUS_URL', directusUrl: storeUrl.value })
}

const developerMode = computed({
  get: () => app.state?.context.settings?.developerMode ?? false,
  set: (value) => {
    app.send({ type: 'UPDATE_SETTINGS', settings: { developerMode: value } })
  },
})

const theme = useTheme()

const isDarkTheme = computed({
  get: () => app.state?.context.settings?.darkTheme ?? true,
  set: (value) => {
    app.send({ type: 'UPDATE_SETTINGS', settings: { darkTheme: value } })
  },
})

watch(isDarkTheme, (value) => {
  theme.global.name.value = value ? 'dark' : 'light'
})
</script>

<template>
  <v-card class="ma-2">
    <template #title>
      Settings
    </template>
    <v-card-text>
      <v-switch
        v-model="developerMode"
        label="Developer mode"
        color="primary"
      />
      <v-switch
        v-model="isDarkTheme"
        label="Dark theme"
        color="primary"
      />
    </v-card-text>
  </v-card>

  <v-expand-transition>
    <v-card v-show="developerMode" class="ma-2">
      <template #title>
        Connect to a custom DDF Store
      </template>

      <template #text>
        <v-alert v-show="store.state?.matches('online')" class="mb-2" title="Connected" type="success">
          Connected to DDF Store at {{ store.state?.context?.directusUrl }}
        </v-alert>
        <v-alert v-show="store.state?.matches('offline')" class="mb-2" title="Offline" type="error">
          <template v-if="store.state?.context?.directusUrl">
            The store at {{ store.state?.context?.directusUrl }} seems offline.
          </template>
          <template v-else>
            No store url configured.
          </template>
        </v-alert>
        <v-alert v-show="store.state?.matches('connecting')" class="mb-2" title="Connecting" type="info">
          Connecting to the store at {{ store.state?.context?.directusUrl }}...
        </v-alert>
        <v-text-field v-model="storeUrl" label="Directus URL" />
      </template>

      <template #actions>
        <v-btn color="primary" @click="updateStoreUrl">
          Connect
        </v-btn>
      </template>
    </v-card>
  </v-expand-transition>
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": true
  }
}
</route>
