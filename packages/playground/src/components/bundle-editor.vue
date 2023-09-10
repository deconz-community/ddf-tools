<script setup lang="ts">
import type { Bundle } from '@deconz-community/ddf-bundler'
import { useVModel } from '@vueuse/core'
import { UseTimeAgo } from '@vueuse/components'
import { bytesToHex } from '@noble/hashes/utils'

const props = defineProps<{
  modelValue: ReturnType<typeof Bundle>
}>()

const emit = defineEmits(['update:modelValue'])

const bundle = useVModel(props, 'modelValue', emit)

const hash = computed(() => {
  if (!bundle.value || !bundle.value.data.hash)
    return
  return bytesToHex(bundle.value.data.hash)
})

const tab = ref('info')

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
</script>

<template>
  <v-card v-if="bundle" class="ma-2">
    <template #title>
      {{ bundle.data.desc.product }}
    </template>

    <template #subtitle>
      Version {{ bundle.data.desc.version }} for deconz {{ bundle.data.desc.version_deconz }}
      <UseTimeAgo v-slot="{ timeAgo }" :time="bundle.data.desc.last_modified">
        • Last modified {{ timeAgo }}
      </UseTimeAgo>
    </template>

    <v-tabs v-model="tab" bg-color="primary">
      <v-tab value="info">
        <v-icon size="x-large" icon="mdi-information" start />
        Info
      </v-tab>
      <v-tab value="ddf">
        <v-icon size="x-large" icon="mdi-file-code" start />
        DDF
      </v-tab>
      <v-tab value="files">
        <v-icon size="x-large" icon="mdi-file" start />
        {{ `${bundle.data.files.length} ${bundle.data.files.length > 1 ? 'Files' : 'File'}` }}
      </v-tab>
    </v-tabs>

    <v-card-text>
      <v-window v-model="tab">
        <v-window-item value="info">
          <v-text-field
            v-model="bundle.data.desc.uuid"
            readonly
            label="UUID"
          />
          <v-text-field
            v-model="hash"
            readonly
            label="Hash"
          />

          <h2 class="text-h6 mb-2">
            Supported devices
          </h2>
          <v-divider />
          <template v-for="devices, manufacturer in supportedDevices" :key="manufacturer">
            <h3 class="ma-1 ml-4">
              {{ manufacturer }}
              <v-chip v-for="device, index in devices" :key="index" class="ma-1">
                {{ device }}
              </v-chip>
            </h3>
            <v-divider />
          </template>
        </v-window-item>

        <v-window-item value="ddf">
          <codemirror
            v-model="bundle.data.ddfc"
            placeholder="Code goes here..."
            :autofocus="false"
            :indent-with-tab="false"
            :tab-size="2"
          />
        </v-window-item>

        <v-window-item value="files">
          <bundle-files-editor v-model="bundle.data.files" />
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>
