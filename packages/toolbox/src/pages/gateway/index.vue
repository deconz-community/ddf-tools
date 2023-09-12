<script setup lang="ts">
import CardGateway from '~/components/card/card-gateway.vue'

const app = useAppMachine('app')

const discovery = useAppMachine('discovery')

const discoveryUri = ref<string>(JSON.parse(import.meta.env.VITE_GATEWAY_DISCOVERY_URI).join(','))

const newList = computed(() => {
  const list = []

  const discoveredGateway = discovery.state ? Array.from(discovery.state.context.results.values()) : []
  // console.log(discoveredGateway)

  const existingGateway = app.state ? Array.from(app.state.context.machine.gateways.keys()) : []

  list.push(...existingGateway)

  discoveredGateway.forEach((value) => {
    if (existingGateway.includes(value.id))
      return
    list.push(value.id)
  })

  return list
})
</script>

<template>
  <v-card class="ma-3">
    <v-card-title>
      Scan for gateways
    </v-card-title>
    <v-card-text>
      <v-text-field
        v-model="discoveryUri"
        label="Address"
        hide-details
        :loading="discovery.state?.matches('scanning')"
      />
    </v-card-text>
    <v-card-actions>
      <v-btn
        :disabled="discovery.state?.matches('scanning')"
        @click="discovery.send({ type: 'START_SCAN', uri: discoveryUri.split(',') })"
      >
        Scan
      </v-btn>
    </v-card-actions>
  </v-card>
  <CardGateway v-for="gateway in newList" :id="gateway" :key="gateway" />
</template>

<route lang="json">
  {
    "meta": {
      "hideLevelTwoSidebar": true
    }
  }
  </route>
