<script setup lang="ts">
const props = defineProps<{
  gateway: string
}>()

const gateways = useGatewaysStore()

const gateway = computed(() => gateways.gateways[props.gateway])
const state = computed(() => gateway.value.state.value)
</script>

<template>
  <v-card class="ma-2">
    <template #title>
      Gateway Page
    </template>

    <template v-if="gateway" #text>
      <json-viewer :value="state.context.devices_list" />

      <p>Is offline : {{ state.matches("offline") }}</p>
    </template>
  </v-card>
</template>
