<script setup lang="ts">
const props = defineProps<{
  gateway: string
}>()

const gateway = useAppMachine('gateway', computed(() => ({ id: props.gateway })))

const credentials = computed(() => {
  return gateway.state?.context.credentials
})
const devices = computed(() => {
  return Object.keys(gateway.state?.context.devices ?? [])
})
/*
const gateways = useGatewaysStore()

const gateway = await gateways.getGateway(props.gateway)

if (!gateway)
  throw new Error('no gateway')
const { state, machine } = gateway

const canFixIssue = useSelector(machine, state => state.can('EDIT_CREDENTIALS'))

const gateway = gateways.gateways[props.gateway]

console.log(gateway)

const state = computed(() => state)

function send(event: string) {
  console.log('sending event', event)
  gateway.machine.send(event)
}
*/
const drawer = ref(false)
onMounted(() => setTimeout(() => drawer.value = true, 0))
</script>

<template>
  <portal to="before-content">
    <!--
    <v-navigation-drawer v-model="drawer" width="240" permanent>
      <v-toolbar height="48" :title="state.context.credentials.name" />
      <v-list lines="one">
        <template v-for="device, index in state.context.devices" :key="index">
          <list-item-device :device="device" />
        </template>

        <v-list-item
          v-for="item in state.context.devices"
          :key="item.title"
          :title="item.title"
          subtitle="..."
        />
      </v-list>
    </v-navigation-drawer>
    -->
  </portal>

  <v-card class="ma-2">
    <template #title>
      Gateway Page
    </template>
    <template #text>
      <pre>{{ credentials }}</pre>
      <pre>{{ devices }}</pre>
      <!--
      <json-viewer :value="state.toStrings().pop()" />
      <json-viewer :value="state.context" />

      <v-btn :disabled="!state.can('Fix issue')" @click="machine.send('Fix issue')">
        Fix issue
      </v-btn>
      -->
      <!--
      <form-gateway-credentials :gateway="gateway" />
      -->

      <!--
      <json-viewer :value="state.context" />

      <v-btn v-if="state.can('Fix issue')" @click="gateway.machine.send('Fix issue')">
        Fix issue
      </v-btn>

      <p>Is offline : {{ state.matches("offline") }}</p>
      -->
    </template>
  </v-card>
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": false
  }
}
</route>
