<script setup lang="ts">
import { endpoints, gatewayClient } from '@deconz-community/rest-client'
import { useRouteQuery } from '@vueuse/router'

import { VTreeview } from 'vuetify/labs/VTreeview'

/*
import hmacSHA256 from 'crypto-js/hmac-sha256'

const installCode = ref<string>(import.meta.env.VITE_INSTALL_CODE)
const challenge = ref<string>('')
const challengeResult = computed(() => {
  if (challenge.value.length !== 64 || installCode.value.length !== 16)
    return ''
  return hmacSHA256(challenge.value, installCode.value.toLowerCase())
})
*/

const apiUrl = ref<string>(import.meta.env.VITE_API_URL ?? 'http://localhost:80')
const apiKey = ref<string>(import.meta.env.VITE_API_KEY ?? '')

const path = useRouteQuery('path')

interface TreeLeaf {
  alias: string
  title: string
  children?: TreeLeaf[]
}

const apiTree: TreeLeaf[] = []

Object.entries(endpoints).forEach(([alias, api]) => {
  const path = api.path.replace('/api/{:apiKey:}', '')
  const parts = path.substring(1).split('/')
  const categoryTitle = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
  const title = `${api.method.toUpperCase()} ${path}`

  const leaf = apiTree.find(leaf => leaf.title === categoryTitle)
  if (leaf) {
    if (!leaf.children)
      leaf.children = []
    leaf.children.push({
      alias,
      title,
    })
  }
  else {
    apiTree.push({
      alias: '',
      title: categoryTitle,
      children: [{
        alias,
        title,
      }],
    })
  }
})

function onLeafClick(leaf) {
  console.log(leaf)
}
</script>

<template>
  <portal to="sidebar-level-two">
    <VTreeview
      :items="apiTree"
      density="compact"
      activatable
    />
  </portal>
  <v-card width="100%" class="ma-2">
    <template #title>
      Gateway
    </template>

    <template #text>
      <v-row>
        <v-col cols="12" sm="6">
          <v-text-field v-model="apiUrl" label="API Url" />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field v-model="apiKey" label="API Key" />
        </v-col>
      </v-row>

      <v-text-field v-model="path" label="path" />

      <pre>{{ apiTree }}</pre>

      <!--
      <v-expansion-panels>
        <v-expansion-panel title="Authentication Challenge">
          <template #text>
            <v-text-field v-model="installCode" label="Install code" />
            <v-text-field v-model="challenge" label="Challenge" />
            <v-text-field v-model="challengeResult" readonly label="Challenge result" />
          </template>
        </v-expansion-panel>
      </v-expansion-panels>
      -->

      <!--
      <zodios-api
        v-for="api in gateway.api" :key="api.path"
        :api="api" :client="gateway" :api-key="apiKey"
      />
      -->
    </template>
  </v-card>
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": false
  }
}
</route>
