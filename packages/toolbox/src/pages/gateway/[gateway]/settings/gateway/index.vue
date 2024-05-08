<script setup lang="ts">
const props = defineProps<{
  gateway: string
}>()

const machines = createUseAppMachine()
const gatewayMachine = machines.use('gateway', computed(() => ({ id: props.gateway })))
const config = computed(() => gatewayMachine.state?.context.config)
const gateway = computed(() => gatewayMachine.state?.context.gateway)
</script>

<template>
  <v-card v-if="config">
    <v-card-title class="ma-2">
      {{ config.name }}
      <v-btn icon="mdi-pencil" density="comfortable" @click="editName()" />
      <v-btn icon="mdi-refresh" density="comfortable" @click="gatewayMachine.send({ type: 'REFRESH_CONFIG' })" />
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="6">
          <h3 class="text-h5">
            Gateway
          </h3>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
