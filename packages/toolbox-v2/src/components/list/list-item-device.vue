<script setup lang="ts">
import { useSelector } from '@xstate/vue'
import type { ActorRefFrom } from 'xstate'

const props = defineProps<{
  device: ActorRefFrom<typeof deviceMachine>
}>()

const route = useRoute()
const data = useSelector(props.device, state => state.context.data)
</script>

<template>
  <v-list-item
    v-if="data"
    :title="data.name"
    :subtitle="data.manufacturername"
    :to="`${route.fullPath}/${props.device.id}`"
  />
  <v-list-item
    v-else
    title="Uknown device"
    :subtitle="props.device.id"
    :to="`${route.fullPath}/${props.device.id}`"
  />
</template>
