<script setup lang="ts">
import Color from 'color'

const props = defineProps<{
  gatewayId: string
}>()

const route = useRoute()
const machines = createUseAppMachine()
const gateway = machines.use('gateway', computed(() => ({ id: props.gatewayId })))

const badgeColor = computed(() => {
  return Color(`#${props.gatewayId.substring(10)}`)
    .lightness(80)
    .hex()
})

const active = computed(() => props.gatewayId === route.params.gateway)
</script>

<template>
  <v-list-item class="ma-1 justify-center">
    <btn-rounded-circle
      :color="badgeColor"
      :to="`/gateway/${props.gatewayId}`"
      :active="active"
    >
      {{ gateway.state?.context.credentials.name.substring(0, 1) }}
      <v-tooltip location="right" activator="parent">
        {{ gateway.state?.context.credentials.name }}
      </v-tooltip>
    </btn-rounded-circle>
  </v-list-item>
</template>
