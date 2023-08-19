<script setup lang="ts">
const gatewayStore = useGatewaysStore()

const creds = JSON.parse(import.meta.env.VITE_GATEWAY_CREDENTIALS)

const gateway = computed(() => {
  return Object.values(gatewayStore.gateways)?.[0]
})

function resetCreds() {
  const credentials = JSON.parse(import.meta.env.VITE_GATEWAY_CREDENTIALS)
  objectKeys(gatewayStore.credentials).forEach((key) => {
    delete gatewayStore.credentials[key]
  })
  gatewayStore.addCredentials(credentials)
}

function removeCreds() {
  gatewayStore.removeCredentials(creds.id)
}

function test() {
}
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
      <v-btn @click="resetCreds()">
        Reset credentials
      </v-btn>
      <v-btn @click="removeCreds()">
        Remove credentials
      </v-btn>
      <v-btn @click="test()">
        TEST
      </v-btn>

      <json-viewer :value="gatewayStore.credentials" />

      <template v-if="gateway">
        <json-viewer :value="gateway.state.value.context" />
        <v-btn
          v-for="nextEvent in gateway.state.value.nextEvents"
          :key="nextEvent"
          @click="gateway.machine.send(nextEvent)"
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
