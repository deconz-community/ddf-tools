<script setup lang="ts">
import { readBundles } from '~/interfaces/store'

const store = useStore()

const bundleID = ref('8633575f730c1a066ba1a4fa841da43beb571d2aa4c2498878be8fdd09173e38')

const dataRest = store.request(computed(() => readBundles(bundleID.value, {
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
})))
</script>

<template>
  <v-card class="ma-2">
    <template #title>
      Test page
    </template>

    <template #text>
      <pre>{{ store.state?.value }}</pre>
      <v-text-field v-model="bundleID" label="Bundle ID" />
      <!--
      <pre>{{ store.state?.context.profile }}</pre>
      -->
      <pre>{{ dataRest }}</pre>
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
