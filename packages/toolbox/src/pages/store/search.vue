<script setup lang="ts">
import { aggregate } from '@directus/sdk'
import { useRouteQuery } from '@vueuse/router'
import { listBundles } from '~/interfaces/store'

const store = useStore()

const App = useAppStore()

App.navigationTitle = 'Home'

const page = useRouteQuery('page', '1', { transform: Number })
const product = useRouteQuery('product', '')
const manufacturer = useRouteQuery('manufacturer', '')
const model = useRouteQuery('model', '')
const itemsPerPage = ref(5)

const filter = refDebounced(computed(() => {
  const _filters: any[] = []

  if (product.value !== '') {
    _filters.push({
      product: {
        _contains: product.value,
      },
    })
  }

  Object.entries({ manufacturer, model }).forEach(([key, value]) => {
    if (value.value !== '') {
      _filters.push({
        device_identifiers:
        {
          device_identifiers_id: {
            [key]: {
              _contains: value.value,
            },
          },
        },
      })
    }
  })

  if (_filters.length === 0)
    return {}

  return {
    _and: _filters,
  }
}), 500)

const bundleCount = store.request(computed(() => aggregate('bundles', {
  aggregate: { countDistinct: ['ddf_uuid'] },
  query: {
    filter: filter.value,
  },
})))

const bundleList = store.request(computed(() => listBundles({
  fields: [
    'id',
    'product',
    'ddf_uuid',
    'tag',
    'version',
    'date_created',
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
      signatures: ['key'],
    },
  ],
  page: page.value,
  limit: itemsPerPage.value,
  filter: filter.value,
})))

const totalItems = computed(() => {
  if (bundleCount.state.value && bundleCount.state.value[0].countDistinct.ddf_uuid)
    return Number.parseInt(bundleCount.state.value[0].countDistinct.ddf_uuid)
  return 0
})

const pageCount = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))
</script>

<template>
  <v-card class="ma-2">
    <template v-if="bundleList.state.value" #text>
      <v-data-iterator :items="bundleList.state.value">
        <template #header>
          <h1 class="text-h5 d-flex justify-space-between mb-4 align-center">
            <div class="text-truncate">
              DDF Store list of bundles ({{ totalItems }})
            </div>

            <div class="d-flex align-center">
              <div class="d-inline-flex">
                <v-btn
                  :disabled="page === 1"
                  icon="mdi-arrow-left"
                  size="small"
                  variant="tonal"
                  class="me-2"
                  @click="page--"
                />

                <v-btn
                  :disabled="page === pageCount"
                  icon="mdi-arrow-right"
                  size="small"
                  variant="tonal"
                  @click="page++"
                />
              </div>
            </div>
          </h1>
          <div>
            <v-text-field
              v-model="product"
              label="Product"
              outlined
              dense
              hide-details
              class="ma-2"
            />
            <v-text-field
              v-model="manufacturer"
              label="Manufacturer"
              outlined
              dense
              hide-details
              class="ma-2"
              :items="['California', 'Colorado', 'Florida', 'Georgia', 'Texas', 'Wyoming']"
            />
            <v-text-field
              v-model="model"
              label="Model"
              outlined
              dense
              hide-details
              class="ma-2"
              :items="['California', 'Colorado', 'Florida', 'Georgia', 'Texas', 'Wyoming']"
            />
          </div>
        </template>

        <template #default="{ items }">
          <template v-for="(item, i) in items" :key="i">
            <v-card variant="outlined" class="ma-2">
              <v-card-title>
                {{ item.raw.product }}
                <v-chip v-if="item.raw.tag === 'latest'" class="ml-2" color="green">
                  {{ item.raw.tag }}
                </v-chip>
                <v-chip class="ml-2" color="grey">
                  {{ item.raw.id.substr(-10) }}
                </v-chip>
              </v-card-title>
              <v-card-subtitle>
                <template v-for="(signature, s) in item.raw.signatures" :key="s">
                  <chip-user :public-key="signature.key" class="mr-2" />
                </template>
                <UseTimeAgo v-slot="{ timeAgo }" :time="item.raw.date_created">
                  {{ item.raw.version }} • {{ timeAgo }}
                </UseTimeAgo>
              </v-card-subtitle>
              <v-card-text>
                <v-list density="compact">
                  <v-list-subheader>Supported devices</v-list-subheader>
                  <v-list-item
                    v-for="(device_identifier, k) in item.raw.device_identifiers"
                    :key="k"
                    :title="`${device_identifier.device_identifiers_id.manufacturer} • ${device_identifier.device_identifiers_id.model}`"
                  />
                </v-list>
              </v-card-text>
              <v-card-actions>
                <v-btn :to="`/store/bundle/${item.raw.id}`">
                  Open
                </v-btn>
                <v-btn v-if="store.client" :href="`${store.client.url}bundle/download/${item.raw.id}`" prepend-icon="mdi-download">
                  Download
                </v-btn>
              </v-card-actions>
            </v-card>
          </template>
        </template>

        <template #footer>
          <v-pagination v-model="page" :length="pageCount" />
        </template>
      </v-data-iterator>
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
