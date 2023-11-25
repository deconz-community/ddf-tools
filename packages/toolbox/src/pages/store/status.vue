<script setup lang="ts">
// const url = ref(import.meta.env.VITE_DIRECTUS_URL)
const url = ref('http://localhost:8055')
const store = useStore()

function connect() {
  store.send({ type: 'UPDATE_DIRECTUS_URL', directusUrl: url.value })
}
</script>

<template>
  <v-card class="ma-2">
    <template #title>
      Connect to DDF Store
    </template>

    <template #text>
      <v-text-field v-model="url" label="Directus URL" />
    </template>

    <template #actions>
      <v-btn color="primary" @click="connect">
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
