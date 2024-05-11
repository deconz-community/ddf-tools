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

// #region API Keys
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

// #endregion
</script>

<template>
  <v-card v-if="props.param.knownParam !== 'hidden'">
    <v-card-text v-if="props.param.knownParam === 'apiKey'">
      <v-select
        v-model="value"
        :label="props.param.description"
        :items="apiKeys"
        item-title="key"
        item-value="key"
        item-props="props"
      />
    </v-card-text>

    <v-card-text v-else>
      <v-alert
        type="error"
        text="WIP"
      />
      <pre>{{ props.param }}</pre>
    </v-card-text>
  </v-card>
</template>
