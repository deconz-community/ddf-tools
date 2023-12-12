<script setup lang="ts">
import { useTimeAgo } from '@vueuse/core'
import { readBundles } from '~/interfaces/store'

const props = defineProps<{
  bundle: string
}>()

const store = useStore()

const isReady = computed(() => store.state?.matches('online') === true)

const bundle = store.request(computed(() => readBundles(props.bundle, {
  fields: [
    'id',
    'product',
    'version_deconz',
    'date_created',
    {
      device_identifiers: [
        {
          device_identifiers_id: [
            'id',
            'manufacturer',
            'model',
          ],
        },
      ],
    },
  ],
})))

const downloadURL = computed(() => {
  if (!isReady.value || !store.client)
    return null

  return `${store.client.url}bundle/download/${props.bundle}`
})
</script>

<template>
  <v-card v-if="bundle.state.value" class="ma-2">
    <template #title>
      {{ bundle.state.value.product }}
      <v-btn v-if="downloadURL" class="ma-2" :href="downloadURL" prepend-icon="mdi-download">
        Download
      </v-btn>
    </template>

    <template v-if="bundle.state.value.date_created" #subtitle>
      Published {{ useTimeAgo(bundle.state.value.date_created).value }}
    </template>

    <template #text>
      <!--
      <v-alert
        v-if="bundle.deprecated_description"
        type="error"
        title="This version has been deprecated"
        :text="bundle.deprecated_description"
      />
      -->

      <v-card elevation="2">
        <template #title>
          For devices
        </template>
        <template #text>
          <v-table>
            <thead>
              <tr>
                <th class="text-left">
                  Manufacturer
                </th>
                <th class="text-left">
                  Model
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in bundle.state.value.device_identifiers"
                :key="item.device_identifiers_id.id"
              >
                <td>{{ item.device_identifiers_id.manufacturer }}</td>
                <td>{{ item.device_identifiers_id.model }}</td>
              </tr>
            </tbody>
          </v-table>
        </template>
      </v-card>

      <!--
      <v-card v-if="bundleVersions" elevation="1">
        <template #title>
          All versions
        </template>
        <template #text>
          <v-table v-if="lastestVersion">
            <thead>
              <tr>
                <th class="text-left">
                  Version
                </th>
                <th class="text-left">
                  Deconz Version
                </th>
                <th class="text-left">
                  Published
                </th>
                <th class="text-left">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="version in bundleVersions.items"
                :key="version.id"
              >
                <td>
                  {{ version.version }}
                  <v-chip
                    v-if="lastestVersion.pre_release"
                    class="ma-2"
                    color="orange"
                    text-color="white"
                    text="Pre-release"
                  />
                  <v-chip
                    v-if="lastestVersion.deprecated"
                    class="ma-2"
                    color="orange"
                    text-color="red"
                    text="Deprecated"
                  />
                </td>
                <td>{{ version.version_deconz }}</td>
                <td>{{ useTimeAgo(version.created).value }}</td>
                <td>
                  <v-btn class="ma-2" :href="client.getFileUrl(version, version.file)" prepend-icon="mdi-download">
                    Download
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </template>
      </v-card>
      -->
      <!--
        <json-viewer v-if="bundle" :value="bundle" :expand-depth="5" />
        <json-viewer v-if="bundleVersions" :value="bundleVersions" :expand-depth="5" />
        <json-viewer v-if="lastestVersion" :value="lastestVersion" :expand-depth="5" />
      -->
    </template>
  </v-card>

  <pre>{{ bundle.state.value }}</pre>
</template>

<route lang="json">
  {
    "meta": {
      "breadcrumbs": "none",
      "hideLevelTwoSidebar": true
    }
  }
  </route>
