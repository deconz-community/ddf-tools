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
    <template #item="{ props: itemProps, item }">
      <gateway-data :id="item.value" v-slot="{ data, satisfiesVersion: localSatisfiesVersion }" :satisfies-version="props.satisfiesVersion">
        <v-list-item
          v-if="data.config"
          v-bind="itemProps"
          :title="item.title = (data.config.name ?? item.value)"
          :subtitle="`${item.value} - v${data.config.apiversion} ${localSatisfiesVersion ? '' : ' (Unsupported version)'}`"
          :disabled="!localSatisfiesVersion"
        />
      </gateway-data>
    </template>
  </v-select>
</template>
