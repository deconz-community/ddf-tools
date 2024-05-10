<script setup lang="ts">
import { gatewayClient } from '@deconz-community/rest-client'

const url = ref(import.meta.env.VITE_GATEWAY_URL)
const apiKey = ref(import.meta.env.VITE_GATEWAY_KEY)

async function test() {
  const client = gatewayClient({
    address: () => url.value,
    apiKey: () => apiKey.value,
  })

  const result = await client.request('updateConfig', {
    config: {
      name: 'New name',
    },
  })

  console.log({ result })
}
</script>

<template>
  <v-card class="ma-2">
    <v-card-title>
      Test
    </v-card-title>
    <v-card-text>
      <v-text-field v-model="url" name="url" />
      <v-text-field v-model="apiKey" name="apiKey" />
      <v-btn variant="tonal" block size="large" @click="test()">
        Test
      </v-btn>
    </v-card-text>
  </v-card>
</template>
