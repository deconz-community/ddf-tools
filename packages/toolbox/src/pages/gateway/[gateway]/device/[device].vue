<script setup lang="ts">
const props = defineProps<{
  gateway: string
  device: string
}>()

const device = useAppMachine('device', computed(() => ({ gateway: props.gateway, id: props.device })))
</script>

<template>
  <v-card v-if="device.state && device.state.context.data" class="ma-3">
    <v-card-title>
      {{ device.state.context.data.name }}
    </v-card-title>
    <v-card-subtitle>
      {{ device.state.context.data.manufacturername }} - {{ device.state.context.data.modelid }}
    </v-card-subtitle>
    <v-card-text>
      <v-sheet elevation="10">
        <pre>{{ device.state.context.data.subdevices[0].state }}</pre>
      </v-sheet>
    </v-card-text>
  </v-card>
  <v-card v-else class="ma-3">
    <v-card-title>
      Loading device {{ props.device }}
    </v-card-title>
    <v-card-text>
      <v-progress-linear indeterminate />
    </v-card-text>
  </v-card>
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": false
  }
}
</route>
