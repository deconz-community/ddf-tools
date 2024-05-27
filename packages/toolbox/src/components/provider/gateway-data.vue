<script setup lang="ts">
import { satisfies } from 'semver'

const props = defineProps<{
  id: string
  satisfiesVersion?: string
}>()

const gatewayData = useGateway(toRef(props, 'id'))
const satisfiesVersion = computed(() => {
  if (!props.satisfiesVersion)
    return true

  return satisfies(gatewayData.config?.apiversion ?? '0.0.0', props.satisfiesVersion)
})
</script>

<template>
  <slot :data="gatewayData" :satisfies-version="satisfiesVersion" />
</template>
