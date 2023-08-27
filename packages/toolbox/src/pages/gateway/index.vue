<script setup lang="ts">
import type { GatewayCredentials } from '~/machines/app'

const app = useAppMachine('app')

const discovery = useAppMachine('discovery')

onMounted(() => {
  discovery.send({ type: 'Start scan' })
})

const list = computed(() => {
  const list: (GatewayCredentials & {
    version: string
    new: boolean
  })[] = []

  const discoveredGateway = discovery.state.value ? Array.from(discovery.state.value.context.results.values()) : []
  // const existingGateway = app.state.value ? Array.from(app.state.value.context.machine.gateways.values()) : []
  const existingGateway = app.state.value ? Array.from(app.state.value.context.machine.gateways.values()) : []

  existingGateway.forEach((value) => {
    // const gateway = useAppMachine('gateway', { id: value.id })
    // console.log(value)
    /*
    list.push({
      ...value,
      new: false,
      version: '',
    })
    */
  })

  discoveredGateway.forEach((value) => {
    list.push({
      ...value,
      id: value.id,
      name: value.name,
      version: value.version,
      new: true,
      apiKey: '',
      URIs: {
        api: value.uri,
        websocket: [],
      },
    })
  })

  return list
})
</script>

<template>
  <v-card
    v-for="result in list" :key="result.id"
    class="ma-3"
  >
    <v-card-item>
      <v-card-title>
        {{ result.name }}
        <v-chip class="ml-2">
          {{ result.version }}
        </v-chip>
        <v-chip v-if="result.new" class="ml-2" color="success">
          New
        </v-chip>
      </v-card-title>
      <v-card-subtitle>{{ result.id }}</v-card-subtitle>
      <v-card-actions>
        <v-btn elevation="2" @click="app.send({ type: 'ADD_GATEWAY_CREDENTIALS', credentials: result })">
          Add
        </v-btn>
      </v-card-actions>
    </v-card-item>
  </v-card>
</template>
