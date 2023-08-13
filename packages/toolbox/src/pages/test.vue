<script setup lang="ts">
const gateway = useGatewaysStore()

const creds = JSON.parse(import.meta.env.VITE_GATEWAY_CREDENTIALS)

// gateway.updateCredentials(JSON.parse(import.meta.env.VITE_GATEWAY_CREDENTIALS))
</script>

<template>
  <v-card class="ma-2">
    <template #title>
      Test page
    </template>

    <template #text>
      Hello world
      <json-viewer :value="gateway.credentials" />
      <json-viewer
        v-if="gateway.gateways[creds.id]?.machine.state.value.context"
        :value="gateway.gateways[creds.id].machine.state.value.context"
      />
    </template>
  </v-card>
</template>
