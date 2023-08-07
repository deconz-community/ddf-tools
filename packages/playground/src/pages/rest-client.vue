<script setup lang="ts">
import { Discovery, Gateway } from '@deconz-community/rest-client'

const apiUrl = ref<string>(import.meta.env.VITE_API_URL)
const apiKey = ref<string>(import.meta.env.VITE_API_KEY)

const discovery = computed(() => Discovery())

const gateway = computed(() => Gateway(apiUrl.value, apiKey.value))

async function test() {
  try {
    // const result = await gateway.client.createAPIKey({ devicetype: 'test' })
    // console.log({ result })

    /*
    const result = await gateway.client.updateConfig({ discovery: true })

    const test = result.success?.UTC

    console.log({ result })
    */
  }
  catch (error) {
    console.error(error)
  }
}
test()
</script>

<template>
  <v-card width="100%" class="ma-2">
    <template #title>
      Discovery
    </template>

    <template #text>
      <zodios-api
        v-for="api in discovery.client.api" :key="api.path"
        :api="api" :client="discovery.client" :api-key="apiKey"
      />
    </template>
  </v-card>

  <v-card width="100%" class="ma-2">
    <template #title>
      Gateway
    </template>

    <template #text>
      <v-text-field v-model="apiUrl" label="API Url" />
      <v-text-field v-model="apiKey" label="API Key" />
      <zodios-api
        v-for="api in gateway.client.api" :key="api.path"
        :api="api" :client="gateway.client" :api-key="apiKey"
      />
    </template>
  </v-card>
</template>
