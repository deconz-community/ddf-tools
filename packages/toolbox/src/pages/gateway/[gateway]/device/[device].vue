<script setup lang="ts">
const props = defineProps<{
  gateway: string
  device: string
}>()

const device = useAppMachine('device', computed(() => ({ gateway: props.gateway, id: props.device })))
</script>

<template>
  <pre v-if="device.state && device.state.context.data">{{ device.state.context.data }}</pre>
  <p v-else>
    No data for device {{ props.device }}
  </p>
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": false
  }
}
</route>
