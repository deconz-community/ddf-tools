<script setup lang="ts">
import { useTimeAgo } from '@vueuse/core'
import { useRouteQuery } from '@vueuse/router'
import { listBundles, readBundles } from '~/interfaces/store'

const props = defineProps<{
  bundle: string
}>()

const store = useStore()

const activeTab = useRouteQuery('activeTab', 'readme')

const isReady = computed(() => store.state?.matches('online') === true)

const bundle = store.request(computed(() => readBundles(props.bundle, {
  fields: [
    'id',
    'ddf_uuid',
    'product',
    'version_deconz',
    'date_created',
    'content_size',
    'file_count',
    {
      device_identifiers: [
        {
          device_identifiers_id: [
            'manufacturer',
            'model',
          ],
        },
      ],
    },
    {
      signatures: [
        'key',
        'signature',
      ],
    },
  ],
})))

const otherVersions = store.request(computed(() => {
  if (bundle.state.value === null)
    return undefined

  return listBundles({
    fields: [
      'id',
      'version_deconz',
      'date_created',
    ],
    filter: {
      _and: [
        {
          ddf_uuid: {
            _eq: bundle.state.value.ddf_uuid,
          },
        },
      ],
    },
    sort: ['-date_created'],
  })
},

))

const downloadURL = computed(() => {
  if (!isReady.value || !store.client)
    return undefined

  return `${store.client.url}bundle/download/${props.bundle}`
})
</script>

<template>
  <v-card v-if="bundle.state.value" class="ma-2">
    <v-card-title>
      {{ bundle.state.value.product }}
      <v-chip class="ma-2" variant="flat" color="green">
        Stable
      </v-chip>
      <v-chip class="ma-2" variant="flat" color="orange">
        Beta
      </v-chip>
      <v-chip class="ma-2" variant="flat" color="red">
        Alpha
      </v-chip>
      <v-chip class="ma-2" color="grey">
        {{ bundle.state.value.id.substring(bundle.state.value.id.length - 10) }}
      </v-chip>

      <v-divider />
    </v-card-title>

    <v-card-subtitle>
      Published {{ useTimeAgo(bundle.state.value.date_created).value }}
    </v-card-subtitle>

    <v-card-text>
      <v-tabs
        v-model="activeTab"
        bg-color="primary"
      >
        <v-tab value="readme">
          Readme
        </v-tab>
        <v-tab value="code">
          Code
        </v-tab>
        <v-tab value="versions">
          {{ otherVersions.state.value?.length || 0 }} Versions
        </v-tab>
      </v-tabs>

      <v-sheet class="d-flex bg-surface-variant">
        <v-sheet class="flex-grow-1 ma-2 pa-2">
          <v-window v-model="activeTab">
            <v-window-item value="readme">
              <v-card elevation="2" class="ma-2">
                <template #title>
                  Supported devices
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
            </v-window-item>

            <v-window-item value="code">
              <pre class="ma-2">{{ {
                bundle: bundle.state.value,
                otherVersions: otherVersions.state.value,
              } }}</pre>
            </v-window-item>

            <v-window-item value="versions">
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
            </v-window-item>
          </v-window>
        </v-sheet>

        <v-sheet class="ma-2 pa-2 d-flex flex-column" width="30%">
          <v-btn
            block
            color="primary"
            prepend-icon="mdi-download"
            class="mb-2"
          >
            Install
          </v-btn>
          <v-btn
            block color="primary"
            prepend-icon="mdi-download"
            :disabled="!downloadURL"
            :href="downloadURL"
          >
            Download
          </v-btn>
          <v-list class="d-flex flex-column">
            <v-list-item title="Hash">
              ...{{ bundle.state.value.id.substring(bundle.state.value.id.length - 10) }}
            </v-list-item>
            <v-list-item title="Published">
              {{ useTimeAgo(bundle.state.value.date_created).value }}
            </v-list-item>
            <v-list-item title="Version deconz">
              {{ bundle.state.value.version_deconz }}
            </v-list-item>
            <v-list-item title="Supported devices">
              {{ bundle.state.value.device_identifiers.length }}
            </v-list-item>
            <v-list-item title="Bundle Size">
              {{ bundle.state.value.content_size ?? 'Unknown' }}
            </v-list-item>
            <v-list-item title="Total Files">
              {{ bundle.state.value.file_count ?? 'Unknown' }}
            </v-list-item>
            <v-list-item title="Collaborators">
              <template v-for="(signature, s) in bundle.state.value.signatures" :key="s">
                <chip-user :public-key="signature.key" class="mr-4 ma-2" size="large" />
                <v-spacer />
              </template>
            </v-list-item>
          </v-list>
          <v-btn color="red" prepend-icon="mdi-flag" class="w-100">
            Report malware
          </v-btn>
        </v-sheet>
      </v-sheet>
    </v-card-text>
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
