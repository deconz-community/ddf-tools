<script setup lang="ts">
import type { Bundle, Source } from '@deconz-community/ddf-bundler'
import { buildFromFiles, createSource, decode, generateHash } from '@deconz-community/ddf-bundler'

const baseDEUrl = 'https://raw.githubusercontent.com/dresden-elektronik/deconz-rest-plugin/master/devices'
// const baseDCUrl = 'https://raw.githubusercontent.com/deconz-community/ddf/main'

const genericDE = `${baseDEUrl}/generic`
// const devicesDC = `${baseDCUrl}/devices`
// const genericDC = `${devicesDC}/generic`

const sampleList = {
  'STARKVIND Air purifier': [genericDE, `${baseDEUrl}/ikea/starkvind_air_purifier.json`],
  'FYRTUR block-out roller blind': [genericDE, `${baseDEUrl}/ikea/fyrtur_block-out_roller_blind.json`],
  'SYMFONISK sound remote gen2': [genericDE, `${baseDEUrl}/ikea/symfonisk_sound_remote_gen2.json`],
  'Lutron Aurora': [genericDE, `${baseDEUrl}/lutron/lutron_aurora_foh.json`],
  'Mijia open/close sensor MCCGQ01LM': [genericDE, `${baseDEUrl}/xiaomi/xiaomi_mccgq01lm_openclose_sensor.json`],
  'Mijia smart plug ZNCZ04LM': [genericDE, `${baseDEUrl}/xiaomi/xiaomi_zncz04lm_smart_plug_v24.json`],
  'Danalock V3': [genericDE, `${baseDEUrl}/danalock/danalock_v3.json`],
} as const

const defaultSample: keyof typeof sampleList = 'STARKVIND Air purifier'

const error = ref('')

const bundle = ref<ReturnType<typeof Bundle> | undefined>()

const genericDirectoryUrl = ref<string>(sampleList[defaultSample][0])
const fileUrl = ref<string>(sampleList[defaultSample][1])

async function buildFromGithub() {
  error.value = ''

  const sources = new Map<string, Source>()

  try {
    const newBundle = await buildFromFiles(
      genericDirectoryUrl.value,
      fileUrl.value,
      async (path) => {
        if (sources.has(path))
          return sources.get(path)!

        const result = await fetch(path)
        if (result.status !== 200)
          throw new Error(result.statusText)
        const data = await result.blob()

        const source = createSource(data, {
          path,
          last_modified: new Date(),
        })
        sources.set(path, source)
        return source
      },
    )

    newBundle.data.hash = await generateHash(newBundle.data)
    bundle.value = newBundle
  }
  catch (e) {
    error.value = 'Something went wrong while loading the bundle.'
    console.warn(e)
  }
}

// TMP for testing
buildFromGithub()
</script>

<template>
  <bundle-editor-v2 v-if="bundle" v-model="bundle" class="fill-height" />
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": true
  }
}
</route>
