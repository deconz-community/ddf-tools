<script setup lang="ts" generic="Type extends MachineType">
import type { EventFrom } from 'xstate'
import type { MachineType } from '~/composables/useAppMachine'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  machine: ReturnType<typeof useAppMachine<Type>>
  event: EventFrom<typeof useAppMachine<Type>>
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
