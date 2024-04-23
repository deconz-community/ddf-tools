<script setup lang="ts">
import { createDirectus, readMe, readSettings, rest } from '@directus/sdk'

const store = useStore()
</script>

<template>
  <v-card class="ma-2">
    <template #title>
      Test page
    </template>

    <template #text>
      <!--
      <pre>{{ store.state?.value }}</pre>
      <pre>{{ settings.state }}</pre>
      -->
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
