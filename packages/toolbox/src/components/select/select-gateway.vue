<script setup lang="ts">
const props = defineProps<{
  satisfiesVersion?: string
}>()

const selectedGateway = defineModel<string | undefined>({ default: undefined })

const app = useApp()
</script>

<template>
  <v-select
    v-model="selectedGateway"
    label="Select"
    :items="app.gatewayIds"
    clearable
  >
    <template #item="{ props: itemProps, internalItem }">
      <gateway-data :id="internalItem.value" v-slot="{ data, satisfiesVersion: localSatisfiesVersion }" :satisfies-version="props.satisfiesVersion">
        <v-list-item
          v-if="data.config"
          v-bind="itemProps"
          :title="internalItem.title = (data.config.name ?? internalItem.value)"
          :subtitle="`${internalItem.value} - v${data.config.apiversion} ${localSatisfiesVersion ? '' : ' (Unsupported version)'}`"
          :disabled="!localSatisfiesVersion"
        />
      </gateway-data>
    </template>
  </v-select>
</template>
