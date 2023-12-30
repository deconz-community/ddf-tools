<script setup lang="ts" generic="Type extends AppMachine['type']">
import type { AppMachine, ExtractMachine, UseAppMachine } from '~/composables/useAppMachine'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  machine: UseAppMachine<Type>
  event: ExtractMachine<Type>['events']
  label?: string
}>()
</script>

<template>
  <v-btn
    v-bind="{ ...props, ...$attrs }"
    :disabled="props.machine.state?.can(props.event) !== true"
    @click="props.machine.send(props.event as never)"
  >
    {{ props.label ?? props.event.type }}
  </v-btn>
</template>
