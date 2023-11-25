<script setup lang="ts">
const app = useAppMachine('app')

const store = useStore()
const route = useRoute()

const storeUrl = ref(typeof route.query.storeUrl === 'string' ? route.query.storeUrl : '')

function updateStoreUrl() {
  store.send({ type: 'UPDATE_DIRECTUS_URL', directusUrl: storeUrl.value })
}
</script>

<template>
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
