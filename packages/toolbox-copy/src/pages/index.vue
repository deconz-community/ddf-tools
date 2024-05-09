<script setup lang="ts">
import { gatewayClient } from '@deconz-community/rest-client'

const url = ref(import.meta.env.VITE_GATEWAY_URL)
const apiKey = ref(import.meta.env.VITE_GATEWAY_KEY)

async function test() {
  const client = gatewayClient(() => url.value, () => apiKey.value)

  const result = await client.request('getConfig', {
    groupId: 3,
    apiKey: 'foo',
  })

  if (result.isOk()) {
    if (result.value.authenticated)
      console.log(result.value.whitelist)
    else
      console.log(`apiversion${result.value.apiversion}`)
  }
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
