<script setup lang="ts">
import { buildFromFiles, createSource, decode, generateHash } from '@deconz-community/ddf-bundler'
import type { Bundle, Source } from '@deconz-community/ddf-bundler'

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

const leftSideBar = ref(false)

const items = [
  {
    title: 'Foo',
    value: 'foo',
  },
  {
    title: 'Bar',
    value: 'bar',
  },
  {
    title: 'Fizz',
    value: 'fizz',
  },
  {
    title: 'Buzz',
    value: 'buzz',
  },
]
</script>

<template>
  <v-card>
    <v-layout>
      <v-app-bar
        color="primary"
        prominent
      >
        <v-app-bar-nav-icon variant="text" @click.stop="leftSideBar = !leftSideBar" />

        <v-toolbar-title>Bundler V2</v-toolbar-title>

        <v-spacer />

        <template v-if="$vuetify.display.mdAndUp">
          <v-btn icon="mdi-magnify" variant="text" />

          <v-btn icon="mdi-filter" variant="text" />
        </template>

        <v-btn icon="mdi-dots-vertical" variant="text" />
      </v-app-bar>

      <v-navigation-drawer
        v-model="leftSideBar"
        :location="$vuetify.display.mobile ? undefined /*'bottom'*/ : undefined"
        temporary
      >
        <v-list
          :items="items"
        />
      </v-navigation-drawer>

      <v-main style="height: 500px;">
        <v-card-text>
          The navigation drawer will appear from the bottom on smaller size screens.
        </v-card-text>
      </v-main>
    </v-layout>
  </v-card>
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": true
  }
}
</route>
