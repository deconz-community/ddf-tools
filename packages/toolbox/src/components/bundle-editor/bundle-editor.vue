<script setup lang="ts">
import type { Bundle } from '@deconz-community/ddf-bundler'
import { useVModel } from '@vueuse/core'
import { bytesToHex } from '@noble/hashes/utils'
import VueMonacoEditor from '@guolao/vue-monaco-editor'
import { encode, generateHash } from '@deconz-community/ddf-bundler'
import { saveAs } from 'file-saver'
import { produce } from 'immer'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  modelValue: ReturnType<typeof Bundle>
}>()

const emit = defineEmits(['update:modelValue'])

const bundle = useVModel(props, 'modelValue', emit)
const tab = ref('info')
const dirty = ref(false)
const { cloned: ddfc, sync: syncDDF } = useCloned(() => bundle.value.data.ddfc)
const { cloned: files, sync: syncFiles } = useCloned(() => bundle.value.data.files, {
  clone: (data: typeof bundle.value.data.files) => {
    return [...data.map(item => produce(item, () => {}))]
  },
})

async function updateMeta() {
  bundle.value.generateDESC()
  bundle.value.data.hash = await generateHash(bundle.value.data)
}

watch(bundle, () => {
  syncDDF()
  syncFiles()
  dirty.value = false
})

watch([ddfc, files], () => {
  dirty.value = true
})

const hash = computed(() => {
  return bytesToHex(bundle.value.data.hash ?? new Uint8Array())
})

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

async function download() {
  saveAs(encode(bundle.value), bundle.value.data.name)
}

const timeAgo = useTimeAgo(() => bundle.value.data.desc.last_modified)
</script>

<template>
  <v-card v-bind="$attrs">
    <template #title>
      {{ bundle.data.desc.product }} {{ dirty ? '• Modified' : '' }}
      <template v-for="signature in bundle.data.signatures" :key="signature.signature">
        <chip-user :public-key="signature.key" class="ma-2" />
      </template>
    </template>

    <template #subtitle>
      Version {{ bundle.data.desc.version }} for deconz {{ bundle.data.desc.version_deconz }}
      • Last modified {{ timeAgo }}
      <br>
      Hash : {{ hash }}
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
        {{ `${files.length} ${files.length > 1 ? 'Files' : 'File'}` }}
      </v-tab>
      <v-tab value="signatures">
        <v-icon size="x-large" icon="mdi-file" start />
        {{ `${bundle.data.signatures.length} ${bundle.data.signatures.length > 1 ? 'Signatures' : 'Signature'}` }}
      </v-tab>

      <v-spacer />

      <v-btn
        prepend-icon="mdi-download"
        color="blue-grey"
        class="ma-1"
        @click="download()"
      >
        Download
      </v-btn>
    </v-tabs>

    <v-card-text>
      <v-window v-model="tab">
        <v-window-item value="info">
          <v-text-field
            v-model="bundle.data.desc.uuid"
            readonly
            label="UUID"
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
          <VueMonacoEditor
            v-model:value="ddfc"
            theme="vs-dark"
            language="json"
            height="500px"
            :options="{
              automaticLayout: true,
            }"
            @change="updateMeta()"
          />
        </v-window-item>

        <v-window-item value="files">
          <bundle-editor-files
            v-model="files"
            @change="updateMeta()"
          />
        </v-window-item>

        <v-window-item value="signatures">
          <bundle-editor-signatures
            v-model="bundle.data.signatures"
            :hash="bundle.data.hash"
            @change="dirty = true"
          />
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>
