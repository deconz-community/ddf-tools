<script setup>
import { gatewayClient } from '@deconz-community/rest-client'

const test = computed(() => 'foo')

const url = ref(import.meta.env.VITE_GATEWAY_URL)
const apiKey = ref(import.meta.env.VITE_GATEWAY_KEY)

const client = gatewayClient(() => url.value, () => apiKey.value)
</script>

<template>
  <v-card class="ma-2">
    <v-card-title>
      Test
    </v-card-title>
    <v-card-text>
      <v-text-field v-model="url" name="url" />
      <v-text-field v-model="apiKey" name="apiKey" />
    </v-card-text>
  </v-card>
</template>
