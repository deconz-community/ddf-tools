<script setup lang="ts">
const gateway = useGatewaysStore()

const creds = JSON.parse(import.meta.env.VITE_GATEWAY_CREDENTIALS)

const machine = computed(() => {
  return gateway.gateways[creds.id]?.machine
})

/*
const context = useSelector(machine.value, state => state.context)

const nextEvents = computed(() => {
  console.log('compute nextEvents')
  if (!machine.value)
    return null

  return useSelector(machine.value, state => state.nextEvents).value
})
*/

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

      <template v-if="gateway.gateways[creds.id]">
        <json-viewer :value="gateway.gateways[creds.id].state.value.context" />
        <v-btn
          v-for="nextEvent in gateway.gateways[creds.id].state.value.nextEvents"
          :key="nextEvent"
          @click="machine.send(nextEvent)"
        >
          {{ nextEvent }}
        </v-btn>
      </template>
      <!--

      <template v-if="machine">
        <json-viewer
          :value="context"
        />

        <v-btn
          v-for="nextEvent in nextEvents"
          :key="nextEvent"
          @click="machine.send(nextEvent)"
        >
          {{ nextEvent }}
        </v-btn>
      </template>
      -->
    </template>
  </v-card>
</template>
