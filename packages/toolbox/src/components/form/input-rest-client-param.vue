<script setup lang="ts">
import type { ParameterDefinition } from '@deconz-community/rest-client'

// #region Props
const props = defineProps<{
  gateway: string
  name: string
  param: ParameterDefinition
}>()

const model = defineModel<Record<string, any>>({ default: {} })

const value = computed({
  get: () => model.value[props.name],
  set: value => model.value[props.name] = value,
})

// #endregion
const gateway = useGateway(props.gateway)
const sampleValue = computed(() => props.param.sample)

// #region Gateway Data
const apiKeys = computed(() => {
  if (!gateway.config || !gateway.config.authenticated)
    return []
  return Object.entries(gateway.config.whitelist).map(([key, value]) => ({
    key,
    props: {
      subtitle: `${value.name}`,
    },
  }))
})

const devicesUUID = computed(() => {
  if (!gateway.devices)
    return []

  return Array.from(gateway.devices.keys()).map(uuid => ({
    key: uuid,
    /*
    props: {
      subtitle: `${value.name}`,
    },
    */
  }))
})

// #endregion

// #region Set default value
switch (props.param.knownParam) {
  case undefined:
    value.value = sampleValue.value
    break
  case 'apiKey':
    value.value = apiKeys.value[0]?.key
    break
  case 'device/uuid':
    value.value = devicesUUID.value[0]?.key
    break
}
// #endregion
</script>

<template>
  <template v-if="props.param.knownParam !== 'hidden'">
    <v-autocomplete
      v-if="props.param.knownParam === 'apiKey'"
      v-model="value"
      auto-select-first
      clearable
      :label="props.param.description"
      :items="apiKeys"
      item-title="key"
      item-value="key"
      item-props="props"
    />
    <v-autocomplete
      v-else-if="props.param.knownParam === 'device/uuid'"
      v-model="value"
      clearable
      :label="props.param.description"
      :items="devicesUUID"
      item-title="key"
      item-value="key"
    />
    <VTextField
      v-else-if="typeof sampleValue === 'string'"
      v-model="value"
      :label="props.param.description"
    />
    <VTextField
      v-else-if="typeof sampleValue === 'number'"
      v-model.number="value"
      type="number"
      :label="props.param.description"
    />
    <VCheckbox
      v-else-if="typeof sampleValue === 'boolean'"
      v-model="value"
      :label="props.param.description"
    />
    <template v-else-if="typeof sampleValue === 'object'">
      <ObjectEditor
        v-model="value"
        :label="props.param.description"
        :error="false"
      />
    </template>
    <template v-else>
      <v-alert
        type="error"
        text="WIP"
      />
      <pre>{{ props.param }}</pre>
    </template>
  </template>
</template>
