<script setup lang="ts">
import { listBundles } from '~/interfaces/store'

const store = useStore()

const App = useAppStore()

App.navigationTitle = 'Home'

const bundleList = store.request(computed(() => listBundles({
  fields: [
    'id',
    'product',
    'ddf_uuid',
    'tag',
    'version',
    'version_deconz',
    'device_identifiers',
    'signatures',
  ],
})))
</script>

<template>
  <v-card class="ma-2">
    <template #title>
      DDF Store Temporary list of bundles
    </template>

    <template #text>
      <v-table v-if="bundleList.state.value">
        <thead>
          <tr>
            <th class="text-left">
              ID
            </th>
            <th class="text-left">
              Name
            </th>
            <th class="text-left">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="bundle of bundleList.state.value"
            :key="bundle.id as string"
          >
            <td>{{ bundle.id.substr(-10) }}</td>
            <td>{{ bundle.product }}</td>
            <td>
              <v-btn :to="`/bundle/${bundle.id}`">
                Open
              </v-btn>

              <v-btn v-if="store.client" :href="`${store.client.url}bundle/download/${bundle.id}`">
                Download
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </template>
  </v-card>
</template>

<route lang="json">
{
  "meta": {
    "breadcrumbs": "none",
    "hideLevelTwoSidebar": true
  }
}
</route>
