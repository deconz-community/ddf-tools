<script setup lang="ts">
// const discovery = useActor(computed(() => app.service.children.get('discovery')!))
const sampleCreds = JSON.parse(import.meta.env.VITE_GATEWAY_CREDENTIALS)
const appActor = useAppMachine('app')

const discovery = useAppMachine('discovery')

const gateway = useAppMachine('gateway', { id: sampleCreds.id })

// const discovery = useActor(app.children.get('discovery')!)

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
    credentials: sampleCreds,
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

  <json-viewer v-if="gateway.state.value" :value="gateway.state.value.value" :expand-depth="5" />
</template>

<route lang="json">
{
  "meta": {
    "breadcrumbs": "none",
    "hideLevelTwoSidebar": true
  }
}
</route>
