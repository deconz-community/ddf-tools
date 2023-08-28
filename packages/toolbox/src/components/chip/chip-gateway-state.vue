<script setup lang="ts">
import type { ShallowRef } from 'vue'
import type { MachinesTypes } from '~/composables/useAppMachine'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  state: ShallowRef<MachinesTypes['gateway']['state']>
}>()

const errorMessage = computed(() => {
  if (props.state.value.matches('offline.error.invalid API key'))
    return 'Invalid API Key'
  if (props.state.value.matches('offline.error.unreachable'))
    return 'Unreachable'
  return 'Unknown error'
})
</script>

<template>
  <v-chip v-if="['connecting', 'init'].some(props.state.value.matches)" v-bind="$attrs" color="blue">
    Connecting
  </v-chip>
  <v-chip v-else-if="props.state.value.matches('online')" v-bind="$attrs" color="green">
    Online
  </v-chip>
  <v-chip v-else-if="props.state.value.matches('offline.disabled')" v-bind="$attrs" color="gray">
    Disabled
  </v-chip>
  <v-tooltip v-else-if="props.state.value.matches('offline')" :text="errorMessage">
    <template #activator="{ props: localProps }">
      <v-chip v-bind="{ ...localProps, ...$attrs }" color="red">
        Offline
      </v-chip>
    </template>
  </v-tooltip>
  <v-chip v-else v-bind="$attrs" color="gray">
    What ?!?
  </v-chip>
</template>
