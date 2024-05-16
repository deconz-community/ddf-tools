<script setup lang="ts">
import type { ParameterDefinition } from '@deconz-community/rest-client'

// #region Props
const props = defineProps<{
  gateway: string
  name: string
  param: ParameterDefinition
  fancyUi: boolean
}>()

const model = defineModel<Record<string, any>>({ default: {} })

const value = computed({
  get: () => model.value[props.name],
  set: value => model.value[props.name] = value,
})

// #endregion
const gateway = useGateway(props.gateway)

const sampleValue = computed(() => {
  if (props.param.format === 'blob')
    return undefined

  if (typeof props.param.sample === 'function')
    return props.param.sample(gateway)
  return props.param.sample
})

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
  return Array.from(gateway.devices.entries())
    .map(([uuid, device]) => ({
      key: uuid,
      name: device.name,
      props: {
        subtitle: uuid,
      },
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

const bundlesHash = computed(() => {
  return Array.from(gateway.bundles.entries())
    .map(([hash, bundle]) => ({
      key: hash,
      name: `${bundle.product} (${hash.substring(0, 8)})`,
      props: {
        subtitle: bundle.last_modified,
      },
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
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
  case 'device/uuid':{
    gateway.send({ type: 'REFRESH_DEVICES' })
    const selectFirst = () => value.value = devicesUUID.value[0]?.key
    selectFirst()
    if (value.value === undefined)
      watchOnce(refDebounced(devicesUUID, 200), selectFirst)
    break
  }
  case 'bundle/hash':{
    gateway.send({ type: 'REFRESH_BUNDLES' })
    const selectFirst = () => value.value = bundlesHash.value[0]?.key
    selectFirst()
    if (value.value === undefined)
      watchOnce(refDebounced(bundlesHash, 200), selectFirst)
    break
  }
  case 'alarmSystem/id':
    value.value = '1'
    break
}

// #endregion
</script>

<template>
  <template v-if="props.param.knownParam !== 'hidden'">
    <template v-if="props.param.format === 'blob'">
      <v-file-input
        v-model="value"
        :label="props.param.description"
      />
    </template>
    <template v-else-if="props.param.format === 'string'">
      <v-autocomplete
        v-if="props.fancyUi && props.param.knownParam === 'apiKey'"
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
        v-else-if="props.fancyUi && props.param.knownParam === 'device/uuid'"
        v-model="value"
        clearable
        :label="props.param.description"
        :items="devicesUUID"
        item-title="name"
        item-value="key"
        append-icon="mdi-refresh"
        @click:append="gateway.send({ type: 'REFRESH_DEVICES' })"
      />
      <v-autocomplete
        v-else-if="props.fancyUi && props.param.knownParam === 'bundle/hash'"
        v-model="value"
        clearable
        :label="props.param.description"
        :items="bundlesHash"
        item-title="name"
        item-value="key"
        append-icon="mdi-refresh"
        @click:append="gateway.send({ type: 'REFRESH_BUNDLES' })"
      />
      <v-autocomplete
        v-else-if="props.fancyUi && props.param.knownParam === 'alarmSystem/id'"
        v-model="value"
        required
        :label="props.param.description"
        :items="[{ key: '1', name: 'Alarm System 1' }]"
        item-title="name"
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
      <template v-else>
        <v-alert
          type="error"
          text="No UI for that format yet."
        />
        <pre>{{ props.param }}</pre>
      </template>
    </template>
    <template v-else-if="props.param.format === 'json'">
      <ObjectEditor
        v-model="value"
        :label="props.param.description"
        :error="false"
      />
    </template>
    <template v-else>
      <v-alert
        type="error"
        text="No UI for that format yet."
      />
      <pre>{{ props.param }}</pre>
    </template>
  </template>
</template>
