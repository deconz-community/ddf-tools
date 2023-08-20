<script setup lang="ts">
import Color from 'color'
import type { GatewayCredentials } from '~/interfaces/deconz'

const props = defineProps<{
  uuid: string
  credentials: GatewayCredentials
}>()

const badgeColor = computed(() => {
  return Color(`#${props.credentials.id.substring(10)}`)
    .lightness(80)
    .hex()
})

const active = computed(() => props.credentials.id === 'WIP')
</script>

<template>
  <v-list-item class="ma-1 justify-center">
    <btn-rounded-circle
      :color="badgeColor"
      :to="`/gateway/${props.uuid}`"
      :active="active"
    >
      {{ props.credentials.name.substring(0, 1) }}
      <v-tooltip location="right" activator="parent">
        {{ props.credentials.name }}
      </v-tooltip>
    </btn-rounded-circle>
  </v-list-item>
</template>
