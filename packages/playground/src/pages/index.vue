<script setup lang="ts">
import * as secp from '@noble/secp256k1'
import { computedAsync } from '@vueuse/core'
import { NIL as uuidNIL, v4 as uuidv4 } from 'uuid'

import { Bundle, decode, encode, sign, verify } from '@deconz-community/ddf-bundler'

import { bytesToHex, hexToBytes } from '@noble/hashes/utils'

import { saveAs } from 'file-saver'
import { buildFromFile } from '~/composables/builder'

const error = ref('')

const baseUrl = 'https://raw.githubusercontent.com/dresden-elektronik/deconz-rest-plugin/master/devices'
const genericDirectoryUrl = ref(`${baseUrl}/generic`)
const fileUrl = ref(`${baseUrl}/ikea/starkvind_air_purifier.json`)
const files = ref<File[]>([])
const sha = ref('')

const uniqueID = ref(uuidv4())

const privateKey = ref(secp.utils.randomPrivateKey())
const privateKeyHex = computed(() => bytesToHex(privateKey.value))

const bundle = shallowRef(Bundle())

const hashHex = computed(() => bundle.value.data.hash ? bytesToHex(bundle.value.data.hash) : '')

const signatures = computedAsync(async () => {
  return await Promise.all(bundle.value.data.signatures.map(async (signature) => {
    if (bundle.value.data.hash) {
      return {
        ...signature,
        key: bytesToHex(signature.key),
        signature: bytesToHex(signature.signature),
        valid: (await verify(bundle.value.data.hash, signature.key, signature.signature)),
      }
    }
  }))
}, [])

watch(uniqueID, () => {
  bundle.value.data.desc.uuid = uniqueID.value
  triggerRef(bundle)
})

const parseFile = async () => {
  error.value = ''
  sha.value = ''

  if (files.value.length === 0)
    return
  bundle.value = await decode(files.value[0])
}

const makeBundle = async () => {
  let bundled = encode(bundle.value)
  bundled = await sign(bundled, [{
    key: hexToBytes(privateKeyHex.value),
  }])
  saveAs(bundled, bundle.value.data.name)
}

const generatePrivateKey = () => {
  privateKey.value = secp.utils.randomPrivateKey()
}

const generateUUID = () => {
  uniqueID.value = uuidv4()
}

const reset = () => {
  bundle.value = Bundle()
}

watch(files, parseFile)

const desc = computed(() => {
  return JSON.stringify(bundle.value.data.desc, null, 4)
})

const download = async () => {
  error.value = ''

  try {
    bundle.value = await buildFromFile(genericDirectoryUrl.value, fileUrl.value, async (url: string) => {
      const result = await fetch(url)
      if (result.status !== 200)
        throw new Error(result.statusText)

      return await result.blob()
    })
    if (bundle.value.data.desc.uuid === uuidNIL)
      bundle.value.data.desc.uuid = uniqueID.value
    else
      uniqueID.value = bundle.value.data.desc.uuid
  }
  catch (e) {
    error.value = 'Erreur'
    console.warn(e)
  }

  triggerRef(bundle)
}

watch(bundle, () => {
  try {
    const data = JSON.parse(bundle.value.data.ddfc)
    /*
    const result = validate(data)
    console.log(result)
    */
  }
  catch (e) {
    console.log(e)
  }
})
</script>

<template>
  <v-card width="100%" class="ma-2">
    <template #title>
      DDF Bundle
    </template>

    <template #text>
      <v-alert class="ma-2">
        <p>This is a small HTML/JS to test reading and writing the RIFF based DDF bundle.</p>
        <p>
          Following shows the bundle chunks content.
          The UI can currently display and edit chunks but can't create a new one.
          For chunk with binary data a download button is displayed.
          Click on the icons on the left side to triggers actions.
        </p>
      </v-alert>

      <v-alert
        v-show="error"
        class="ma-2"
        type="error"
        title="Error"
        :text="error"
      />

      <v-text-field
        v-model="genericDirectoryUrl"
        label="Generic directory url"
        prepend-icon="mdi-download-network"
      />

      <v-text-field
        v-model="fileUrl"
        label="Load DDF From URL"
      >
        <template #prepend>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-icon
                v-bind="props" icon="mdi-download-network"
                @click="download()"
              />
            </template>
            Load
          </v-tooltip>
        </template>
      </v-text-field>

      <v-file-input
        v-model="files"
        label="Open .ddf bundle from disk"
        accept=".ddf"
      />

      <v-text-field
        v-model="privateKeyHex"
        label="Private key"
      >
        <template #prepend>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-icon
                v-bind="props" icon="mdi-refresh"
                @click="generatePrivateKey()"
              />
            </template>
            Generate a new private key
          </v-tooltip>
        </template>
      </v-text-field>

      <v-text-field
        v-model="uniqueID"
        label="Unique UUID"
      >
        <template #prepend>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-icon
                v-bind="props" icon="mdi-refresh"
                @click="generateUUID()"
              />
            </template>
            Generate a new UUID
          </v-tooltip>
        </template>
      </v-text-field>

      <v-btn
        prepend-icon="mdi-vacuum"
        color="blue-grey"
        @click="reset()"
      >
        Reset
      </v-btn>

      <v-btn
        prepend-icon="mdi-download"
        color="blue-grey"
        @click="makeBundle()"
      >
        Download Bundle
      </v-btn>
      <!--
      <json-viewer :value="bundle.data"></json-viewer>

      <v-text-field v-model="sha" label="SHA256" readonly />
      -->

      <v-card>
        <template #title>
          Bundle
        </template>
        <template #subtitle>
          {{ bundle.data.name }}
        </template>
        <template #text>
          <v-text-field
            v-model="hashHex"
            readonly
            label="HASH"
          />
          <v-card v-if="signatures.length > 0">
            <template #title>
              Signatures
            </template>
            <template #text>
              <template
                v-for="(signature, index) in signatures"
                :key="index"
              >
                <v-card
                  v-if="signature"
                >
                  <template #title>
                    Signature #{{ index + 1 }}
                    <v-chip
                      v-if="signature.valid"
                      color="green"
                    >
                      Valid
                    </v-chip>
                    <v-chip
                      v-else
                      color="red"
                    >
                      Invalid
                    </v-chip>
                  </template>

                  <template #text>
                    <v-text-field
                      v-model="signature.key"
                      readonly
                      label="Public Key"
                    />
                    <v-text-field
                      v-model="signature.signature"
                      readonly
                      label="Signature"
                    />
                  </template>
                </v-card>
              </template>
            </template>
          </v-card>
        </template>
      </v-card>

      <v-card>
        <template #title>
          DESC (readonly)
        </template>
        <template #text>
          <codemirror
            v-model="desc"
            placeholder="Code goes here..."
            :autofocus="true"
            :indent-with-tab="true"
            :tab-size="2"
          />
        </template>
      </v-card>

      <v-card>
        <template #title>
          DDFC
        </template>
        <template #text>
          <codemirror
            v-model="bundle.data.ddfc"
            placeholder="Code goes here..."
            :autofocus="false"
            :indent-with-tab="false"
            :tab-size="2"
          />
        </template>
      </v-card>

      <v-card v-for="index in bundle.data.files.length" :key="index">
        <template #title>
          {{ bundle.data.files[index - 1].path }} - {{ bundle.data.files[index - 1].type }}
        </template>
        <template #text>
          <template v-if="typeof bundle.data.files[index - 1].data === 'string'">
            <codemirror
              v-if="typeof bundle.data.files[index - 1].data === 'string'"
              v-model="bundle.data.files[index - 1].data"
              placeholder="Code goes here..."
              :autofocus="false"
              :indent-with-tab="false"
              :tab-size="2"
            />
          </template>
          <template v-else>
            <v-btn
              prepend-icon="mdi-download"
              color="blue-grey"
              @click="saveAs(bundle.data.files[index - 1].data, bundle.data.files[index - 1].path)"
            >
              Download File
            </v-btn>
          </template>
        </template>
      </v-card>
    </template>
  </v-card>
</template>
