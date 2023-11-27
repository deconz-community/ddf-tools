<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router'

const store = useStore()

const storeUrl = useRouteQuery('storeUrl', '')

function updateStoreUrl() {
  store.send({ type: 'UPDATE_DIRECTUS_URL', directusUrl: storeUrl.value })
}
</script>

<template>
  <v-alert v-show="store.state?.matches('online')" class="ma-2" title="Connected" type="success">
    Connected to DDF Store at {{ store.state?.context?.directusUrl }}
  </v-alert>
  <v-alert v-show="store.state?.matches('offline')" class="ma-2" title="Offline" type="error">
    <template v-if="store.state?.context?.directusUrl">
      The store at {{ store.state?.context?.directusUrl }} seems offline.
    </template>
    <template v-else>
      No store url configured.
    </template>
  </v-alert>
  <v-alert v-show="store.state?.matches('connecting')" class="ma-2" title="Connecting" type="info">
    Connecting to the store at {{ store.state?.context?.directusUrl }}...
  </v-alert>

  <v-card class="ma-2">
    <template #title>
      Connect to DDF Store
    </template>

    <template #text>
      <v-text-field v-model="storeUrl" label="Directus URL" />
    </template>

    <template #actions>
      <v-btn color="primary" @click="updateStoreUrl">
        Connect
      </v-btn>
    </template>
  </v-card>
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": true
  }
}
</route>
