<script setup lang="ts">
const route = useRoute()

const baseURL = computed(() => {
  if (route.params.gateway === undefined)
    return ''
  return `/gateway/${route.params.gateway}`
})

const gateway = useAppMachine('gateway', computed(() => ({ id: route.params.gateway as string })))

const devices = computed(() => {
  const devices: { name: string; id: string; type: string }[] = []

  if (gateway.state) {
    objectKeys(gateway.state.context.devices).forEach((id) => {
      const device = useAppMachine('device', computed(() => ({ gateway: route.params.gateway as string, id })))
      /*
      // Hide empty devices like the gateway itself
      if (device.state?.context.data?.name === undefined)
        return
      */

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
      title="API Keys"
      :to="`${baseURL}/config/whitelist`"
    />
    <v-list-subheader>Devices</v-list-subheader>
    <v-list-item
      v-for="device in devices" :key="device.id"
      :title="device.name"
      :subtitle="device.type"
      :to="`${baseURL}/device/${device.id}`"
    />
  </v-list>
</template>
