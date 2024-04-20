<script setup lang="ts">
import { readSettings } from '@directus/sdk'

const store = useStore()

const settings = store.request(computed(() => readSettings()))

function startPopupLogin() {
  console.log('startPopupLogin')
  store.send({ type: 'START_POPUP_LOGIN' })
}
function stopPopupLogin() {
  console.log('stopPopupLogin')
  store.send({ type: 'STOP_POPUP_LOGIN' })
}
</script>

<template>
  <v-card class="ma-2">
    <template #title>
      Test page
    </template>

    <template #text>
      <!--
      <pre>{{ store.state?.value }}</pre>
      <pre>{{ settings.state }}</pre>
      -->
      <v-btn @click="startPopupLogin">
        Start
      </v-btn>
      <v-btn @click="stopPopupLogin">
        Stop
      </v-btn>
    </template>
  </v-card>
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": true
  }
}
</route>
