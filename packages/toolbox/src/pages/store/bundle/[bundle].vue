<script setup lang="ts">
import { useTimeAgo } from '@vueuse/core'
import { listBundles, readBundles } from '~/interfaces/store'

const props = defineProps<{
  bundle: string
}>()

const store = useStore()

const isReady = computed(() => store.state?.matches('online') === true)

const bundle = store.request(computed(() => readBundles(props.bundle, {
  fields: [
    'id',
    'ddf_uuid',
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

const otherVersions = store.request(computed(() => listBundles({
  fields: [
    'id',
    'product',
    'version_deconz',
    'date_created',
  ],
  filter: {
    _and: [
      {
        ddf_uuid: {
          _eq: bundle.state.value?.ddf_uuid,
        },
      },
      {
        id: {
          _neq: bundle.state.value?.id,
        },
      },
    ],
  },
  sort: ['-date_created'],
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

      <v-chip class="ml-2" color="grey">
        {{ bundle.state.value.id.substring(bundle.state.value.id.length - 10) }}
      </v-chip>
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

      <v-card v-if="otherVersions.state.value" elevation="1">
        <template #title>
          Other versions
        </template>
        <template #text>
          <v-table>
            <thead>
              <tr>
                <th class="text-left">
                  Hash
                </th>
                <th class="text-left">
                  Version Deconz
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
                v-for="version in otherVersions.state.value"
                :key="version.id"
              >
                <td>
                  <v-chip class="ml-2" color="grey">
                    {{ version.id.substring(version.id.length - 10) }}
                  </v-chip>
                </td>
                <td>{{ version.version_deconz }}</td>
                <td>{{ useTimeAgo(version.date_created).value }}</td>
                <td>
                  <v-btn :to="`/store/bundle/${version.id}`">
                    Open
                  </v-btn>
                  <v-btn class="ma-2" :href="`${store.client.url}bundle/download/${version.id}`" prepend-icon="mdi-download">
                    Download
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </template>
      </v-card>
    </template>
  </v-card>

  <pre class="ma-2">{{ {
    bundle: bundle.state.value,
    otherVersions: otherVersions.state.value,
  } }}</pre>
</template>

<route lang="json">
  {
    "meta": {
      "breadcrumbs": "none",
      "hideLevelTwoSidebar": true
    }
  }
  </route>
