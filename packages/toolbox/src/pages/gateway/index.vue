<script setup lang="ts">
import CardGateway from '~/components/card/card-gateway.vue'

const app = useAppMachine({ type: 'app' })

const discovery = useAppMachine({ type: 'discovery' })

onMounted(() => {
  // console.log('Start scan')
  discovery.send({ type: 'Start scan', uri: JSON.parse(import.meta.env.VITE_GATEWAY_DISCOVERY_URI) })
})

const newList = computed(() => {
  const list = []

  const discoveredGateway = discovery.state.value ? Array.from(discovery.state.value.context.results.values()) : []
  // console.log(discoveredGateway)
  const existingGateway = app.state.value ? Array.from(app.state.value.context.machine.gateways.keys()) : []

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
  <CardGateway v-for="gateway in newList" :id="gateway" :key="gateway" />
</template>
