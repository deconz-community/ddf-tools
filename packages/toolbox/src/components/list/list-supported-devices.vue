<script setup lang="ts">
type deviceIdentifiers = [ string, string ] | {
  device_identifiers_id: {
    manufacturer: string
    model: string
  }
}
const props = defineProps<{
  deviceIdentifiers?: deviceIdentifiers[]
}>()

const supportedDevices = computed(() => {
  if (!props.deviceIdentifiers)
    return []
  return props.deviceIdentifiers.reduce(
    (acc: Record<string, string[]>, item: deviceIdentifiers) => {
      let manufacturer: string
      let model: string

      if (Array.isArray(item)) {
        manufacturer = item[0]
        model = item[1]
      }
      else {
        manufacturer = item.device_identifiers_id.manufacturer
        model = item.device_identifiers_id.model
      }

      if (!acc[manufacturer])
        acc[manufacturer] = []

      acc[manufacturer].push(model)

      return acc
    },
    {},
  )
})
</script>

<template>
  <h3 v-for="devices, manufacturer in supportedDevices" :key="manufacturer" class="ma-1 ml-4">
    {{ manufacturer }}
    <v-chip v-for="device, index in devices" :key="index" class="ma-1">
      {{ device }}
    </v-chip>
    <v-divider />
  </h3>
</template>
