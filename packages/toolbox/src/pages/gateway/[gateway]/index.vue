<script setup lang="ts">
import { useSelector } from '@xstate/vue'

const props = defineProps<{
  gateway: string
}>()

const gateways = useGatewaysStore()

const gateway = await gateways.getGateway(props.gateway)

if (!gateway)
  throw new Error('no gateway')

const { state, machine } = gateway

const canFixIssue = useSelector(machine, state => state.can('Fix issue'))

/*
const gateway = gateways.gateways[props.gateway]

console.log(gateway)

const state = computed(() => state.value)

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
    <template #text>
      <json-viewer :value="state.toStrings().pop()" />
      <json-viewer :value="state.context" />

      <v-btn :disabled="!state.can('Fix issue')" @click="machine.send('Fix issue')">
        Fix issue
      </v-btn>

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
