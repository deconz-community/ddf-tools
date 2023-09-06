<script setup lang="ts" generic="Type extends AppMachine['type']">
import type { EventFrom } from 'xstate'
import type { AppMachine, ExtractMachine, UseAppMachine } from '~/composables/useAppMachine'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  machine: UseAppMachine<Type>
  event: EventFrom<ExtractMachine<Type>>
}>()
</script>

<template>
  <v-btn
    v-bind="{ ...props, ...$attrs }"
    :disabled="props.machine.state?.value?.can(props.event as any) !== true"
    @click="props.machine.send(props.event as any)"
  >
    {{ props.event }}
  </v-btn>
</template>
