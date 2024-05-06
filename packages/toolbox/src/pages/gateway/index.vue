<script setup lang="ts">
import CardGateway from '~/components/card/card-gateway.vue'

const machines = createUseAppMachine()
const app = machines.use('app')
const discovery = machines.use('discovery')

const discoveryUri = ref<string>(JSON.parse(import.meta.env.VITE_GATEWAY_DISCOVERY_URI).join(','))

const newList = computed(() => {
  const list = []

  const discoveredGateway = discovery.state ? Array.from(discovery.state.context.results.values()) : []
  // console.log(discoveredGateway)

  const existingGateway = app.state ? Array.from(app.state.context.gateways.keys()) : []

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
  <div class="d-flex flex-wrap">
    <v-card
      class="ma-2 d-flex flex-column"
      min-width="300"
      max-width="500"
      min-height="250"
    >
      <v-card-title>
        Scan for gateways
      </v-card-title>
      <v-card-text class="flex-grow-1">
        <v-text-field
          v-model="discoveryUri"
          label="Gateway Address (optional)"
          hide-details
          :loading="discovery.state?.matches('scanning')"
          class="mb-4"
        />
        <p>
          Not finding your gateway? Enter the address manually and click Scan.
        </p>
      </v-card-text>
      <v-card-actions>
        <v-btn
          :disabled="discovery.state?.can({ type: 'START_SCAN' }) === false"
          variant="flat"
          color="primary"
          block
          size="large"
          @click="discovery.send({ type: 'START_SCAN', uris: discoveryUri.split(',') })"
        >
          Scan
        </v-btn>
      </v-card-actions>
    </v-card>
    <CardGateway
      v-for="gateway in newList" :id="gateway" :key="gateway"
      class="ma-2 flex-fill"
      min-width="300"
      max-width="500"
      min-height="250"
    />
  </div>
</template>

<route lang="json">
  {
    "meta": {
      "hideLevelTwoSidebar": true
    }
  }
  </route>
