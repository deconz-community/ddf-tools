<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid'

import { Bundle, decode } from '@deconz-community/ddf-bundler'

import { buildFromFile } from '~/composables/builder'

const error = ref('')

const baseUrl = 'https://raw.githubusercontent.com/deconz-community/ddf/main/devices'
const genericDirectoryUrl = ref(`${baseUrl}/generic`)
const fileUrl = ref(`${baseUrl}/ikea/starkvind_air_purifier.json`)
const files = ref<File[]>([])
const sha = ref('')

// const bundle = shallowRef(Bundle())
const bundle = ref(Bundle())

async function parseFile() {
  error.value = ''
  sha.value = ''

  if (files.value.length === 0)
    return
  bundle.value = await decode(files.value[0])
}

function generateUUID() {
  uniqueID.value = uuidv4()
}

function reset() {
  bundle.value = Bundle()
}

watch(files, parseFile)

const desc = computed(() => {
  return JSON.stringify(bundle.value.data.desc, null, 4)
})

async function buildFromGithub() {
  error.value = ''

  try {
    bundle.value = await buildFromFile(genericDirectoryUrl.value, fileUrl.value, async (url: string) => {
      const result = await fetch(url)
      if (result.status !== 200)
        throw new Error(result.statusText)

      return await result.blob()
    })
  }
  catch (e) {
    error.value = 'Erreur'
    console.warn(e)
  }
}

watch(bundle, () => {
  console.log('Watch bundle from page')
  try {
    // const data = JSON.parse(bundle.value.data.ddfc)
    /*
    const result = validate(data)
    console.log(result)
    */
  }
  catch (e) {
    console.log(e)
  }
})

onMounted(() => {
  buildFromGithub()
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
                @click="buildFromGithub()"
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
    </template>
  </v-card>

  <bundle-editor v-model="bundle" />
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": true
  }
}
</route>
