<script setup lang="ts">
import { endpoints, gatewayClient } from '@deconz-community/rest-client'
import { useRouteQuery } from '@vueuse/router'

import { VTreeview } from 'vuetify/labs/VTreeview'
import { z } from 'zod'

const props = defineProps<{
  gateway: string
}>()

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

// #region API Tree
const selectedAlias = useRouteQuery('alias')

interface APITree {
  title: string
  children: {
    alias: string
    title: string
  }[]
}

const apiTree: APITree[] = []

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
      title: categoryTitle,
      children: [{
        alias,
        title,
      }],
    })
  }
})

function selectAPI(params: unknown) {
  const alias = z.array(z.string())
    .length(1)
    .transform(a => a[0])
    .safeParse(params)

  if (!alias.success)
    return

  selectedAlias.value = alias.data
}

// #endregion

// #region Gateway
const gateway = useGateway(toRef(props, 'gateway'))
const apiUrl2 = computed(() => gateway.config)

// #endregion
</script>

<template>
  <v-card width="100%" class="ma-2">
    <template #title>
      REST Client
    </template>

    <template #text>
      <VTreeview
        active-strategy="single-independent"
        mandatory
        :items="apiTree"
        density="compact"
        activatable
        item-value="alias"
        @update:activated="selectAPI"
      />

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
