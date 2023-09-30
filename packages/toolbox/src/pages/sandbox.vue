<script setup lang="ts">
import { serverInfo } from '@directus/sdk'

const store = useStore()

const info = store.request(serverInfo())

/*
const dataRest = computedAsync(async () => {
  const client = store.client
  if (client === undefined)
    return undefined

  const result = await client.request(readBundles('edcc38de-6170-425c-bf6b-e2454188e0aa', {
    fields: [
      'id',
      'product',
      'version',
      '*',
      {
        device_identifiers: [
          'id',
          {
            device_identifiers_id: [
              'manufacturer',
              'model',
            ],
          },
        ],
      },
    ],
  }))

  return result
}, undefined)
*/
</script>

<template>
  <v-card class="ma-2">
    <template #title>
      Test page
    </template>

    <template #text>
      <pre>{{ store.state?.value }}</pre>
      <pre>{{ info }}</pre>
      <!--
      <pre>{{ store.state?.context.profile }}</pre>
      <pre>{{ dataRest }}</pre>
      -->
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
