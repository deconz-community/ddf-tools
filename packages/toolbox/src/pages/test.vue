<script setup lang="ts">
const app = useAppMachine('gateway', { id: '***REMOVED***' })

console.log(app.state)
</script>

<template>
  {{ Object.keys(app.state?.context.devices ?? {}) }}
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": true
  }
}
</route>
