<script setup lang="ts">
import type { ZodObject } from 'zod'

const props = defineProps<{
  gateway: string
}>()

const machines = createUseAppMachine()
const gatewayMachine = machines.use('gateway', computed(() => ({ id: props.gateway })))
const config = computed(() => gatewayMachine.state?.context.config)
const gateway = computed(() => gatewayMachine.state?.context.gateway)

const permitJoin = computed(() => config.value.permitjoin)

const drawer = ref(false)
onMounted(() => setTimeout(() => drawer.value = true, 0))

async function openGateway() {
  if (!gateway.value)
    return

  await gateway.value.findSensor({})
  await gatewayMachine.send({ type: 'REFRESH_CONFIG' })
  getResult()
}

const findResult = ref()
async function getResult() {
  if (!gateway.value)
    return

  findResult.value = await gateway.value.getSensorFindResult()
}
</script>

<template>
  <portal to="before-content">
    <!--
    <v-navigation-drawer v-model="drawer" width="240" permanent>
      <v-toolbar height="48" :title="state.context.credentials.name" />
      <v-list lines="one">
        <template v-for="device, index in state.context.devices" :key="index">
          <list-item-device :device="device" />
        </template>

        <v-list-item
          v-for="item in state.context.devices"
          :key="item.title"
          :title="item.title"
          subtitle="..."
        />
      </v-list>
    </v-navigation-drawer>
    -->
  </portal>

  <v-card v-if="config" class="ma-2">
    <template #title>
      {{ config.name }}
      <v-btn icon="mdi-refresh" density="comfortable" @click="gatewayMachine.send({ type: 'REFRESH_CONFIG' })" />
    </template>
    <template #subtitle>
      {{ config.bridgeid }}
    </template>
    <template #text>
      <v-btn density="comfortable" text="Add sensor" @click="openGateway()" />
      <v-btn density="comfortable" text="Update find result" @click="getResult()" />
      <pre>{{ { permitJoin, findResult } }}</pre>
      <pre>{{ config }}</pre>
    </template>
  </v-card>
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": false
  }
}
</route>
