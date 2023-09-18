<script setup lang="ts">
import { Bundle, decode, generateHash } from '@deconz-community/ddf-bundler'

import { buildFromFile } from '~/composables/builder'

const baseDEUrl = 'https://raw.githubusercontent.com/dresden-elektronik/deconz-rest-plugin/master/devices'
const baseDCUrl = 'https://raw.githubusercontent.com/deconz-community/ddf/main/devices'

const genericDE = `${baseDEUrl}/generic`

const sampleList = {
  'STARKVIND Air purifier': [`${baseDCUrl}/generic`, `${baseDCUrl}/ikea/starkvind_air_purifier.json`],
  'FYRTUR block-out roller blind': [genericDE, `${baseDEUrl}/ikea/fyrtur_block-out_roller_blind.json`],
  'SYMFONISK sound remote gen2': [genericDE, `${baseDEUrl}/ikea/symfonisk_sound_remote_gen2.json`],
  'Lutron Aurora': [genericDE, `${baseDEUrl}/lutron/lutron_aurora_foh.json`],
  'Mijia open/close sensor MCCGQ01LM': [genericDE, `${baseDEUrl}/xiaomi/xiaomi_mccgq01lm_openclose_sensor.json`],
  'Mijia smart plug ZNCZ04LM': [genericDE, `${baseDEUrl}/xiaomi/xiaomi_zncz04lm_smart_plug_v24.json`],
}

const genericDirectoryUrl = ref<string>('')
const fileUrl = ref<string>('')
const files = ref<File[]>([])
const error = ref('')
const bundle = ref<ReturnType<typeof Bundle> | undefined>()

watch(files, async () => {
  error.value = ''

  if (files.value.length === 0)
    return

  const firstBundle = await decode(files.value[0])
  firstBundle.data.hash = await generateHash(firstBundle.data)
  bundle.value = firstBundle
})

async function buildFromGithub() {
  error.value = ''

  try {
    const newBundle = await buildFromFile(genericDirectoryUrl.value, fileUrl.value, async (url: string) => {
      const result = await fetch(url)
      if (result.status !== 200)
        throw new Error(result.statusText)
      return await result.blob()
    })
    newBundle.data.hash = await generateHash(newBundle.data)
    bundle.value = newBundle
  }
  catch (e) {
    error.value = 'Something went wrong while loading the bundle.'
    console.warn(e)
  }
}

async function createNew() {
  const newBundle = Bundle()
  newBundle.data.hash = await generateHash(newBundle.data)
  bundle.value = newBundle
}

function loadSample(sample: typeof sampleList[keyof typeof sampleList]) {
  const [generic, ddf] = sample
  if (!generic || !ddf)
    return

  genericDirectoryUrl.value = generic
  fileUrl.value = ddf
}

if (import.meta.env.VITE_DEBUG === 'true') {
  onMounted(() => {
    loadSample(sampleList['Mijia smart plug ZNCZ04LM'])
    buildFromGithub()
  })
}
</script>

<template>
  <v-card class="full-card">
    <v-card-title>
      DDF Bundler
      <v-expand-transition>
        <v-btn
          v-show="bundle"
          :disabled="!bundle"
          class="float-right"
          color="red"
          size="small"
          @click="bundle = undefined"
        >
          Reset
        </v-btn>
      </v-expand-transition>
    </v-card-title>
    <v-card-text>
      <v-alert class="ma-2">
        <p>This is a small HTML/JS to test reading and writing the RIFF based DDF bundle.</p>
      </v-alert>

      <v-alert
        v-show="error"
        class="ma-2"
        type="error"
        title="Error"
        :text="error"
      />

      <bundle-editor
        v-if="bundle" v-model="bundle" variant="outlined" class="ma-2"
      />
      <template v-else>
        <v-card variant="outlined" class="ma-2">
          <v-card-title>
            Create new
            <v-btn
              color="primary"
              class="float-right"
              @click="createNew()"
            >
              Create
            </v-btn>
          </v-card-title>
        </v-card>

        <v-card variant="outlined" class="ma-2">
          <v-card-title>
            Open file
          </v-card-title>
          <v-card-text>
            <v-file-input
              v-model="files"
              label="Open .ddf bundle from disk"
              accept=".ddf"
            />
          </v-card-text>
        </v-card>

        <v-card variant="outlined" class="ma-2">
          <v-card-title>
            Build from GitHub source
            <v-btn
              color="primary"
              class="float-right"
              @click="buildFromGithub()"
            >
              Build
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-text-field
              v-model="genericDirectoryUrl"
              label="Generic directory url"
            />
            <v-text-field
              v-model="fileUrl"
              label="Load DDF From URL"
            />
            <v-btn
              v-for="(sample, name) in sampleList" :key="name"
              class="ma-2"
              @click="loadSample(sample)"
            >
              {{ name }}
            </v-btn>
          </v-card-text>
        </v-card>
      </template>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.full-card {
  margin: 8px !important;
  height: calc(100% - 16px); /* 16px est la somme des marges verticales de la carte */
}
</style>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": true
  }
}
</route>
