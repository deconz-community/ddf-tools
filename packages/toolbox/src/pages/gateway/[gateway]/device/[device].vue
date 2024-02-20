<script setup lang="ts">
const props = defineProps<{
  gateway: string
  device: string
}>()

const machines = createUseAppMachine()
const device = machines.use('device', computed(() => ({ gateway: props.gateway, id: props.device })))
const { cloned: deviceName, sync: syncName } = useCloned(() => device.state?.context.data?.name ?? '')

async function updateDeviceName() {
  const client = device.state?.context.gatewayClient
  const deviceId = device.state?.context.data?.subdevices[0].uniqueid
  if (!client || !deviceId)
    return

  try {
    const result = await client.updateSensor({ name: deviceName.value }, { params: { sensorId: deviceId } })

    console.log(result)
  }
  catch (e) {
    console.error(e)
  }

  // syncName()
}
</script>

<template>
  <v-card v-if="device.state && device.state.context.data" class="ma-2">
    <v-card-title>
      {{ device.state.context.data.name }}
      <v-btn :disabled="device.state.matches('fetching') === true" @click="device.send({ type: 'REFRESH' })">
        REFRESH
      </v-btn>
    </v-card-title>
    <v-card-subtitle>
      {{ device.state.context.data.manufacturername }} - {{ device.state.context.data.modelid }}
    </v-card-subtitle>
    <v-card-text>
      <v-text-field
        v-model="deviceName"
        label="Name"
        append-icon="mdi-content-save"
        @click:append="updateDeviceName"
      />

      <v-sheet elevation="10">
        <pre>{{ device.state.context.data }}</pre>
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
