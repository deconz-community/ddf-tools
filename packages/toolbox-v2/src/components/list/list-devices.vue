<script setup lang="ts">
import type { ActorRefFrom } from 'xstate'

const props = defineProps<{
  gateway: ActorRefFrom<typeof gatewayMachine>
}>()
</script>

<template>
  FOOOO
</template>
