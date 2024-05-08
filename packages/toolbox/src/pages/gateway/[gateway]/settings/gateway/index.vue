<script setup lang="ts">
const props = defineProps<{
  gateway: string
}>()

const machines = createUseAppMachine()
const gatewayMachine = machines.use('gateway', computed(() => ({ id: props.gateway })))

const config = computed(() => gatewayMachine.state?.context.config)

function test() {
  console.log('test')
}
</script>

<template>
  <v-card v-if="config" class="ma-2">
    <v-card-title class="ma-2">
      {{ config.name }}
      <btn-gateway-edit-name density="comfortable" :gateway="props.gateway" />
      <!--
      <v-btn icon="mdi-pencil" density="comfortable" @click="editName()" />
      <v-btn icon="mdi-refresh" density="comfortable" @click="gatewayMachine.send({ type: 'REFRESH_CONFIG' })" />
      -->
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="6">
          <v-btn color="primary" @click="test()">
            Test
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
