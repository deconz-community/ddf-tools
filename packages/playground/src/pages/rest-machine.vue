<script setup lang="ts">
import { restMachine } from '@deconz-community/rest-client'
import { useMachine } from '@xstate/vue'
import { inspect } from '@xstate/inspect'

inspect({ iframe: false })

const { state, send } = useMachine(restMachine, {
  devTools: true,
})

watchEffect(() => {
  console.log(state.value.context.discoveryResult)
})
</script>

<template>
  <v-card width="100%" class="ma-2">
    <template #title>
      Gateway
    </template>

    <template #text>
      Hello world
      <json-viewer :value="state.context.discoveryResult" />
      <v-btn @click="send({ type: 'Start discovery' })">
        Find gateways
      </v-btn>
    </template>
  </v-card>
</template>
