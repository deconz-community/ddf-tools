<script setup lang="ts">
import { readBundles } from '~/interfaces/store'

const store = useStore()

const bundleID = ref('3a20ecba2f1294dbea57fa10b0383775606ab5c7ec77f46775eb49ecdd93a5bd')

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
