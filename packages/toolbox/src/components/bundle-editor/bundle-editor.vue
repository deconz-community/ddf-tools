<script setup lang="ts">
import type { Bundle } from '@deconz-community/ddf-bundler'
import { useVModel } from '@vueuse/core'
import { bytesToHex } from '@noble/hashes/utils'
import VueMonacoEditor from '@guolao/vue-monaco-editor'
import { encode, generateHash } from '@deconz-community/ddf-bundler'
import { saveAs } from 'file-saver'
import { produce } from 'immer'

const props = defineProps<{
  modelValue: ReturnType<typeof Bundle>
}>()

const emit = defineEmits(['update:modelValue'])

const bundle = useVModel(props, 'modelValue', emit)
const store = useStore()
const tab = ref('ddf')
const dirty = ref(false)
const { cloned: ddfc, sync: syncDDF } = useCloned(() => bundle.value.data.ddfc)
const { cloned: files, sync: syncFiles } = useCloned(() => bundle.value.data.files, {
  clone: (data: typeof bundle.value.data.files) => {
    return [...data.map(item => produce(item, () => {}))]
  },
})

function triggerRefBundle() {
  triggerRef(bundle)
}

async function updateMeta() {
  bundle.value.generateDESC()

  const a = bytesToHex(await generateHash(bundle.value.data))
  const b = bytesToHex(await generateHash(bundle.value.data))

  bundle.value.data.hash = await generateHash(bundle.value.data)
  console.log(a === b, a)
  triggerRefBundle()
}

watch(bundle, () => {
  console.log('watched bundle')
  syncDDF()
  syncFiles()
  dirty.value = false
})
6TGGN
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

/*
const signatures = computedAsync(async () => {
  if (!bundle.value)
    return []

  const signatures = bundle.value.data.signatures.map((item) => {
    return {
      key: bytesToHex(item.key),
      signature: bytesToHex(item.signature),
      isValid: secp256k1.verify(item.signature, hash.value ?? '', item.key),
    }
  })

  const publicKeys = signatures.reduce((acc: string[], item) => {
    acc.push(item.key)
    return acc
  }, []).filter((item, index, self) => self.indexOf(item) === index)

  const users = await store.client?.collection('user').getList(undefined, undefined, {
    public_key: publicKeys,
  })

  return signatures.map((item) => {
    const user = users?.items.find(user => user.public_key === item.key)
    return {
      ...item,
      user,
    }
  })
}, [])
*/

async function download() {
  saveAs(encode(bundle.value), bundle.value.data.name)
}

const timeAgo = 'FOO' // useTimeAgo(() => bundle.value.data.desc.last_modified)
</script>

<template>
  <v-card v-if="bundle" class="ma-2">
    <template #title>
      {{ bundle.data.desc.product }} {{ dirty ? '• Modified' : '' }}
      <!--
      <template v-for="signature in signatures" :key="signature.signature">
        <chip-user v-if="signature.user" :user="signature.user as any" class="ma-2" />
      </template>
      -->
    </template>

    <template #subtitle>
      Version {{ bundle.data.desc.version }} for deconz {{ bundle.data.desc.version_deconz }}
      • Last modified {{ timeAgo }}
      <br>
      Hash : {{ hash }}
      <br>
      Hash : 20886e09b07e890b0149471b9e59dd659c674d0d41b0d998c9306ca4cf4c0ea9
      <br>
      <v-btn @click="updateMeta()">
        Update Meta
      </v-btn>
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
          />
        </v-window-item>

        <v-window-item value="files">
          <bundle-editor-files
            v-model="files"
          />
        </v-window-item>

        <v-window-item value="signatures">
          <bundle-editor-signatures
            v-model="bundle.data.signatures"
            :hash="bundle.data.hash"
          />
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>
