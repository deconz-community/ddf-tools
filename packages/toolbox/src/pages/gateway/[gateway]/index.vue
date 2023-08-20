<script setup lang="ts">
const props = defineProps<{
  gateway: string
}>()

const gateways = useGatewaysStore()

const gateway = await new Promise<any>((resolve, reject) => {
  const checkGateway = () => {
    const gateway = gateways.gateways[props.gateway]
    if (gateway) {
      resolve(gateway)
      return true
    }
    return false
  }

  if (checkGateway()) {
    console.log('Early return')
    return
  }

  const watcher = gateways.$subscribe(() => {
    if (checkGateway()) {
      watcher()
      console.log('Cleaning up watcher')
    }
  })

  setTimeout(() => {
    reject(new Error('Timeout'))
  }, 1000)
})

console.log(gateway)

/*
const gateway = gateways.gateways[props.gateway]

console.log(gateway)

const state = computed(() => gateway.state.value)

function send(event: string) {
  console.log('sending event', event)
  gateway.machine.send(event)
}
*/
</script>

<template>
  <v-card class="ma-2">
    <template #title>
      Gateway Page
    </template>
    <!--
    <template v-if="gateway" #text>
      <json-viewer :value="state.context" />

      <v-btn @click="send('Fix issue')">
        Fix issue
      </v-btn>

      <json-viewer :value="state.context" />

      <v-btn v-if="state.can('Fix issue')" @click="gateway.machine.send('Fix issue')">
        Fix issue
      </v-btn>

      <p>Is offline : {{ state.matches("offline") }}</p>

    </template>
    -->
  </v-card>
</template>
