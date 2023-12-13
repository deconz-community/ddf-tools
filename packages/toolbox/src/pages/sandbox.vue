<script setup lang="ts">
import { readSettings } from '@directus/sdk'

const store = useStore()

const settings = store.request(computed(() => readSettings({
  
})))
</script>

<template>
  <v-card class="ma-2">
    <template #title>
      Test page
    </template>

    <template #text>
      <pre>{{ store.state?.value }}</pre>
      <pre>{{ settings.state?.value }}</pre>
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
