<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router'
import { aggregate } from '@directus/sdk'
import type { RestCommand } from '@directus/sdk'
import type { Schema } from '~/interfaces/store'

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
        _icontains: product.value,
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
              _icontains: value.value,
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

function bundleSearch(filters: {
  page?: number
  limit?: number
  product?: string
  manufacturer?: string
  model?: string
}): RestCommand<unknown, Schema> {
  return () => {
    const params = Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== ''))
    return {
      method: 'GET',
      path: '/bundle/search',
      params,
    }
  }
}

const bundleList = store.request(computed(() => bundleSearch({
  page: page.value,
  limit: itemsPerPage.value,
  product: product.value,
  manufacturer: manufacturer.value,
  model: model.value,
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
                <chip-signatures :signatures="item.raw.signatures" class="ma-2" />
                <v-chip class="ma-2" color="grey">
                  {{ item.raw.id.substr(-10) }}
                </v-chip>
              </v-card-title>
              <v-card-subtitle>
                <UseTimeAgo v-slot="{ timeAgo }" :time="item.raw.date_created">
                  Published {{ timeAgo }}
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