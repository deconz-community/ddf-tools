<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid'

import type { Bundle } from '@deconz-community/ddf-bundler'

const props = defineProps<{
  bundle: ReturnType<typeof Bundle>
}>()

const bundle = useVModel(props, 'bundle')

const supportedDevices = computed(() => {
  if (!bundle.value)
    return []
  return bundle.value.data.desc.device_identifiers.reduce((acc: Record<string, string[]>, item: [string, string]) => {
    if (!acc[item[0]])
      acc[item[0]] = []
    acc[item[0]].push(item[1])
    return acc
  }, {})
})

const markdownFilesTypes = {
  CHLG: 'Changelog',
  INFO: 'Information',
  WARN: 'Warning',
  KWIS: 'Known issue',
}

const markdownFiles = computed(() => {
  if (!bundle.value)
    return []
  return bundle.value.data.files.filter(file => objectKeys(markdownFilesTypes).includes(file.type as any))
})

function generateUUID() {
  // TODO: Use the store endpoint if the store is online
  bundle.value.data.desc.uuid = uuidv4()
}
</script>

<template>
  <v-text-field
    v-model="bundle.data.desc.uuid"
    readonly
    label="UUID"
    append-icon="mdi-refresh"
    @click:append="generateUUID()"
  />

  <v-card>
    <v-card-title>
      Supported devices
    </v-card-title>
    <v-card-text>
      <list-supported-devices :device-identifiers="bundle.data.desc.device_identifiers" />
    </v-card-text>
  </v-card>

  <template v-for="file in markdownFiles" :key="file.path">
    <v-card>
      <v-card-title>
        {{ markdownFilesTypes[file.type as keyof typeof markdownFilesTypes] }}
      </v-card-title>
      <v-card-text>
        <vue-markdown :source="file.data as string" />
      </v-card-text>
    </v-card>
  </template>
</template>
