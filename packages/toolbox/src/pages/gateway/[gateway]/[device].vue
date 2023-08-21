<script setup lang="ts">
const props = defineProps<{
  gateway: string
  device: string
}>()
</script>

<template>
  Coucou from device
  {{ props.gateway }}
  {{ props.device }}
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": false
  }
}
</route>
