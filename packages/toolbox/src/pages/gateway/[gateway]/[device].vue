<script setup lang="ts">
const props = defineProps<{
  gateway: string
  device: string
}>()

const device = useAppMachine('device', computed(() => ({ gateway: props.gateway, id: props.device })))
</script>

<template>
  <pre>{{ device.state?.context.data }}</pre>
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": false
  }
}
</route>
