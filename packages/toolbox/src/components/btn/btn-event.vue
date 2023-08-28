<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  machine: ReturnType<typeof useAppMachine>
  event: string
}>()

type Event = ReturnType<typeof useAppMachine>['send']
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
