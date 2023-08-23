<script setup lang="ts">
// const discovery = useActor(computed(() => app.service.children.get('discovery')!))

const appActor = useAppMachine('app')

const discovery = useAppMachine('discovery')
const gateway = useAppMachine('gateway', { id: '***REMOVED***' })

// const discovery = useActor(app.children.get('discovery')!)
// const gateway = useActor(app.children.get('***REMOVED***')!)

/*
const discovery = useSelector(app.service, (state) => {
  return {
    value: state.children.get(discovery).getSnapshot().value,
    can: state.children.discovery.getSnapshot().can,
    send: state.children.discovery.send,
  }
})
*/

const debug = computed(() => {
  return {
    childrens: appActor.state.value ? Object.keys(appActor.state.value.children) : [],
    // childrens: appActor.state.value ? Array.from(appActor.state.value.children.keys()) : [],
  }
})

function test() {
}

function addGateway() {
  appActor.send({
    type: 'ADD_GATEWAY_CREDENTIALS',
    credentials: JSON.parse(import.meta.env.VITE_GATEWAY_CREDENTIALS),
  })
}

function scan() {
  discovery.send({
    type: 'Scan',
    uri: 'http://localhost',
  })
}
</script>

<template>
  Discovery
  <v-btn @click="test()">
    Test
  </v-btn>
  <v-btn @click="addGateway()">
    add Gateway
  </v-btn>
  <v-btn v-if="discovery.state.value" :disabled="!discovery.state.value.can('Scan')" @click="scan()">
    Scan
  </v-btn>

  <json-viewer :value="debug" :expand-depth="5" />

  {{ appActor.state.value?.context.credentials }}

  <json-viewer :value="gateway.state.value?.value ?? 'No Value'" :expand-depth="5" />
</template>

<route lang="json">
{
  "meta": {
    "breadcrumbs": "none",
    "hideLevelTwoSidebar": true
  }
}
</route>
