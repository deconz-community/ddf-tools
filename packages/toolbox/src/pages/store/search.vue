<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router'
import type { RestCommand } from '@directus/sdk'
import Snarkdown from '@swayable/vue-snarkdown'
import type { Schema } from '~/interfaces/store'

const store = useStore()

const page = useRouteQuery('page', '1', { transform: Number })
const product = useRouteQuery('product', '')
const manufacturer = useRouteQuery('manufacturer', '')
const model = useRouteQuery('model', '')
const stableOnly = useRouteQuery('showStableOnly', 'false', { transform: (v: string) => v === 'true' })
const showDeprecated = useRouteQuery('showDeprecated', 'false', { transform: (v: string) => v === 'true' })
const itemsPerPage = ref(5)

const bundleList = store.request(computed(() => {
  const keyStable = store.state?.context?.settings?.public_key_stable ?? ''

  return bundleSearch({
    page: page.value,
    limit: itemsPerPage.value,
    product: product.value,
    manufacturer: manufacturer.value,
    model: model.value,
    showDeprecated: showDeprecated.value,
    hasKey: stableOnly.value ? keyStable : '',
  })
}))

const pageCount = computed(() => {
  if (!bundleList.state.value)
    return 0
  return Math.ceil(bundleList.state.value.totalCount / itemsPerPage.value)
})
</script>

<template>
  <v-card class="ma-2">
    <template v-if="bundleList.state.value" #text>
      <v-data-iterator :items="bundleList.state.value.items">
        <template #header>
          <h1 class="text-h5 d-flex justify-space-between mb-4 align-center">
            <div class="text-truncate">
              DDF Store list of bundles ({{ bundleList.state.value.totalCount }})
            </div>

            <div class="d-flex align-center">
              <div class="d-inline-flex">
                <v-btn
                  append-icon="mdi-upload"
                  variant="tonal"
                  class="me-2"
                  to="/store/upload"
                  text="Upload"
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
            />
            <v-text-field
              v-model="model"
              label="Model"
              outlined
              dense
              hide-details
              class="ma-2"
            />
            <v-switch
              v-model="stableOnly"
              label="Stable only"
              hide-details
            />
            <v-switch
              v-model="showDeprecated"
              label="Show deprecated"
              hide-details
            />
          </div>
        </template>

        <template #default="{ items }">
          <v-card v-for="(item, i) in items" :key="i" variant="outlined" class="ma-2">
            <v-card-title class="d-flex align-center">
              <v-chip
                variant="outlined"
                color="primary"
                class="result-title-chip flex-grow-1 text-wrap text-break"
                size="large"
                prepend-icon="mdi-open-in-new"
                label
                :to="`/store/bundle/${item.raw.id}`"
              >
                {{ item.raw.vendor }}
                {{ item.raw.product }}
              </v-chip>

              <v-btn
                v-if="store.client"
                :href="`${store.client.url}bundle/download/${item.raw.id}`"
                variant="outlined"
                append-icon="mdi-download"
                color="secondary"
                class="ml-2 flex-shrink-0"
              >
                Download
              </v-btn>
            </v-card-title>
            <v-card-subtitle class="d-flex flex-wrap align-center">
              <chip-signatures only="user" :signatures="item.raw.signatures" class="ma-2" />
              <UseTimeAgo v-slot="{ timeAgo }" :time="item.raw.source_last_modified">
                published {{ timeAgo }} ({{ new Date(item.raw.source_last_modified).toLocaleDateString() }})
              </UseTimeAgo>
              <chip-signatures
                only="system"
                :signatures="item.raw.signatures"
              />
              <chip-ddf-hash source="store" :hash="item.raw.id" />
            </v-card-subtitle>
            <v-card-text>
              <v-card v-if="item.raw.info" variant="elevated" class="ma-2">
                <v-card-title>
                  Information
                </v-card-title>
                <v-card-text>
                  <Snarkdown :markdown="item.raw.info" />
                </v-card-text>
              </v-card>
              <v-card variant="elevated" class="ma-2">
                <v-card-title>
                  Supported devices
                </v-card-title>
                <v-card-text>
                  <list-supported-devices :device-identifiers="item.raw.device_identifiers" />
                </v-card-text>
              </v-card>
            </v-card-text>
          </v-card>
        </template>

        <template #footer>
          <v-pagination v-model="page" :length="pageCount" />
        </template>
      </v-data-iterator>
    </template>
    <v-alert v-if="bundleList.state.value?.totalCount === 0 && stableOnly" type="info" title="Info" class="ma-2">
      No result ? try to disable the stable only option
    </v-alert>
  </v-card>
</template>

<style scoped>
.result-title-chip {
  max-width: 100%;
  height: auto;
  min-height: 36px;
  white-space: pre-wrap;
}
</style>

<route lang="json">
{
  "meta": {
    "breadcrumbs": "none",
    "hideLevelTwoSidebar": true
  }
}
</route>
