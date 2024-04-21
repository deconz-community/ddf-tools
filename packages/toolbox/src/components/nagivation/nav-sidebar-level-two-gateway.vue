<script setup lang="ts">
import type { EffectScope } from 'vue'

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

const devices = ref(new Map<string, {
  name: string
  id: string
  type: string
}>())

const sortedDevices = computed(() => {
  return Array.from(devices.value.values()).sort((a, b) => {
    const typeCompare = a.type.localeCompare(b.type)
    if (typeCompare !== 0)
      return typeCompare
    return a.name.localeCompare(b.name)
  })
})

// Update devices list
{
  const devicesIds = computed(() => gateway.state ? Array.from(gateway.state.context.devices.keys()) : [])
  const devicesScopes = ref(new Map<string, EffectScope>())
  watchArray(devicesIds, (newList, oldList, added, removed) => {
    added.forEach((id) => {
      const scope = effectScope(true)
      devicesScopes.value.set(id, scope)

      scope.run(() => {
        const device = machines.use('device', computed(() => ({ gateway: route.params.gateway as string, id })))

        watchImmediate(() => device.state, (state) => {
          if (!state || state.context.data?.name === undefined) {
            devices.value.delete(id)
            return
          }

          devices.value.set(id, {
            name: state.context.data?.name ?? id,
            id,
            type: state.context.data?.subdevices[0]?.type ?? 'Unknown',
          })
        })
      })
    })

    removed?.forEach((id) => {
      if (devicesScopes.value.has(id) === false)
        return

      devicesScopes.value.get(id)?.stop()
      devicesScopes.value.delete(id)
    })
  }, { immediate: true })
}
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
    <v-list-item
      prepend-icon="mdi-shovel"
      title="Bundles"
      :to="`${baseURL}/config/bundles`"
    />
    <v-list-subheader>
      Devices
      <v-btn icon="mdi-refresh" size="small" class="ma-2" @click="gateway.send({ type: 'REFRESH_DEVICES' })" />
    </v-list-subheader>
    <v-list-item
      v-for="device in sortedDevices" :key="device.id"
      :title="device.name"
      :subtitle="device.type"
      :to="`${baseURL}/device/${device.id}`"
    />
  </v-list>
</template>
