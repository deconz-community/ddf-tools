<script setup lang="ts">
import type { Bundle } from '@deconz-community/ddf-bundler'
import { useVModel } from '@vueuse/core'
import { bytesToHex } from '@noble/hashes/utils'
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
const isDebug = import.meta.env.VITE_DEBUG === 'true'
const bundle = useVModel(props, 'modelValue', emit)

const signatures = computed(() => bundle.value.data.signatures.map((signature) => {
  return {
    key: bytesToHex(signature.key),
  }
}))

const tab = ref<'info' | 'files' | 'validation' | 'signatures'>('info')
const dirty = ref(false)

const { cloned: files, sync: syncFiles } = useCloned(() => bundle.value.data.files, {
  clone: (data: typeof bundle.value.data.files) => {
    return [...data.map(item => produce(item, () => {}))]
  },
})

async function save() {
  bundle.value.data.files = files.value
  bundle.value.generateDESC()
  bundle.value.data.hash = await generateHash(bundle.value.data)
  dirty.value = false
}

watch(bundle, () => {
  syncFiles()
  dirty.value = false
})

const hash = computed(() => {
  return bytesToHex(bundle.value.data.hash ?? new Uint8Array())
})

async function download() {
  saveAs(encode(bundle.value), bundle.value.data.name)
}

const timeAgo = useTimeAgo(() => bundle.value.data.desc.last_modified)

function setDirty() {
  dirty.value = true
}
</script>

<template>
  <v-card v-bind="$attrs">
    <template #title>
      {{ bundle.data.desc.product }} {{ dirty ? '• Modified' : '' }}
      <chip-signatures :signatures="signatures" class="ma-2" />
    </template>

    <template #subtitle>
      For deconz {{ bundle.data.desc.version_deconz }}
      • Last modified {{ timeAgo }}
      <br>
      Hash : {{ hash }}
    </template>

    <v-tabs v-model="tab" bg-color="primary">
      <v-tab value="info">
        <v-icon size="x-large" icon="mdi-information" start />
        Info
      </v-tab>
      <v-tab value="files">
        <v-icon size="x-large" icon="mdi-file" start />
        {{ `${files.length} ${files.length > 1 ? 'Files' : 'File'}` }}
      </v-tab>
      <v-tab value="validation">
        <v-icon size="x-large" icon="mdi-file-code" start />
        Validation
      </v-tab>
      <v-tab value="signatures">
        <v-icon size="x-large" icon="mdi-file" start />
        {{ `${bundle.data.signatures.length} ${bundle.data.signatures.length > 1 ? 'Signatures' : 'Signature'}` }}
      </v-tab>

      <v-spacer />

      <v-btn
        :prepend-icon="dirty ? 'mdi-content-save' : 'mdi-download'"
        color="blue-grey"
        class="ma-1"
        @click="() => dirty ? save() : download()"
      >
        {{ dirty ? 'Save changes' : 'Download' }}
      </v-btn>
    </v-tabs>

    <v-card-text>
      <v-window v-model="tab">
        <v-window-item value="info">
          <bundle-editor-info :bundle="bundle" />
        </v-window-item>

        <v-window-item value="files">
          <bundle-editor-files-v2
            v-if="isDebug"
            v-model="files"
            @change="setDirty()"
          />

          <bundle-editor-files
            v-else
            v-model="files"
            @change="setDirty()"
          />
        </v-window-item>

        <v-window-item value="validation">
          <bundle-editor-validation
            :bundle="bundle"
            @change="setDirty()"
          />
        </v-window-item>

        <v-window-item value="signatures">
          <bundle-editor-signatures
            v-model="bundle.data.signatures"
            :hash="bundle.data.hash"
            :disabled="dirty"
          />
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>
