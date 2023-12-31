<script setup lang="ts">
const route = useRoute()

const baseURL = computed(() => {
  if (route.params.gateway === undefined)
    return ''
  return `/gateway/${route.params.gateway}`
})

const machines = createUseAppMachine()
const gateway = machines.use('gateway', computed(() => ({ id: route.params.gateway as string })))

const scope = getCurrentScope()
if (!scope)
  throw new Error('no scope')

const devices = computed(() => {
  const devices: { name: string, id: string, type: string }[] = []

  if (gateway.state) {
    Array.from(gateway.state.context.devices.keys()).forEach((id) => {
      const device = machines.use('device', computed(() => ({ gateway: route.params.gateway as string, id })))

      if (!device)
        return

      // Hide empty devices like the gateway itself
      if (device.state?.context.data?.name === undefined)
        return

      devices.push({
        name: device.state?.context.data?.name ?? id,
        id,
        type: device.state?.context.data?.subdevices[0]?.type ?? 'Unknown',
      })
    })
  }

  devices.sort((a, b) => {
    const typeCompare = a.type.localeCompare(b.type)
    if (typeCompare !== 0)
      return typeCompare
    return a.name.localeCompare(b.name)
  })

  return devices
})
</script>

<template>
  <v-toolbar height="48">
    <v-toolbar-title v-if="gateway.state">
      {{ gateway.state.context.credentials.name }}
      <chip-gateway-state :gateway="gateway" class="ml-2" />
    </v-toolbar-title>
  </v-toolbar>

  <v-list>
    <v-list-item prepend-icon="mdi-home" title="Home" :to="`${baseURL}/`" />
    <v-divider />
    <v-list-subheader>Config</v-list-subheader>
    <v-list-item
      prepend-icon="mdi-key-chain"
      title="API Keys"
      :to="`${baseURL}/config/whitelist`"
    />
    <v-list-subheader>
      Devices
      <v-btn icon="mdi-refresh" size="small" class="ma-2" @click="gateway.send({ type: 'REFRESH_DEVICES' })" />
    </v-list-subheader>
    <v-list-item
      v-for="device in devices" :key="device.id"
      :title="device.name"
      :subtitle="device.type"
      :to="`${baseURL}/device/${device.id}`"
    />
  </v-list>
</template>
