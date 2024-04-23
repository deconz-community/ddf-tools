<script setup lang="ts">
import type { UseAppMachine } from '~/composables/useAppMachine'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  gateway: UseAppMachine<'gateway'>
}>()

const state = computed<{
  color: string
  text: string
  tooltip?: string
}>(() => {
  const state = props.gateway.state

  if (state === undefined)
    return { color: 'gray', text: 'Loading...' }

  if (state.matches('online'))
    return { color: 'green', text: 'Online', tooltip: `${state.context.devices.size} devices` }

  if ((['connecting', 'init'] as const).some(s => state.matches(s)))
    return { color: 'blue', text: 'Connecting' }

  if (state.matches({ offline: 'disabled' }))
    return { color: 'gray', text: 'Disabled' }

  if (state.matches({ offline: { error: 'invalidApiKey' } }))
    return { color: 'red', text: 'Offline', tooltip: 'Invalid API key' }

  if (state.matches({ offline: { error: 'unreachable' } }))
    return { color: 'red', text: 'Offline', tooltip: 'Unreachable' }

  if (state.matches({ offline: 'error' }))
    return { color: 'red', text: 'Offline', tooltip: 'Unknown error' }

  if (state.matches('offline'))
    return { color: 'gray', text: 'Offline' }

  return { color: 'gray', text: 'What ?!?', tooltip: state.toString() }
})
</script>

<template>
  <v-tooltip v-if="state.tooltip" :text="state.tooltip">
    <template #activator="{ props: localProps }">
      <v-chip v-bind="{ ...localProps, ...$attrs }" :color="state.color" :text="state.text" />
    </template>
  </v-tooltip>
  <v-chip v-else v-bind="$attrs" :color="state.color" :text="state.text" />
</template>
