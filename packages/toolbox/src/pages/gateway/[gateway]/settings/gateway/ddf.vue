<script setup lang="ts">
import type { Bundle } from '@deconz-community/ddf-bundler'

const props = defineProps<{
  gateway: string
}>()

const app = useApp()
const gateway = useGateway(toRef(props, 'gateway'))

const search = ref('')
const inputUploadBundle = ref<File[]>([])

const isLoading = refDebounced(
  computed(() => !gateway.state?.matches({ online: { config: 'idle' } })),
  50,
)

async function upload() {
  if (inputUploadBundle.value.length === 0)
    return toast.error('You should select at least one DDF bundle')

  const results = (
    await Promise.all(
      inputUploadBundle.value.map(
        async file => await gateway.fetch('uploadDDFBundle', { body: file }),
      ),
    )
  ).flat()

  const errors = results.filter(result => result.isErr())
  const successes = results.filter(result => result.isOk())

  if (errors.length > 0)
    toast.error(`Failed to ${errors.length} DDF ${errors.length > 1 ? 'bundles' : 'bundle'}`)

  if (successes.length > 0)
    toast.success(`Successfully uploaded ${successes.length} DDF ${successes.length > 1 ? 'bundles' : 'bundle'}`)

  gateway.send({ type: 'REFRESH_BUNDLES' })
}

const isActive = ref(false)
const bundleRef = ref<ReturnType<typeof Bundle> | undefined>()

async function inspect(hash: string) {
  const responses = await gateway.fetch('downloadDDFBundleDecoded', {
    hash,
  })
  responses.forEach((response) => {
    if (response.isOk()) {
      bundleRef.value = response.value
      bundleRef.value.data.name = `${hash}.ddf`
      isActive.value = true
    }
    else {
      bundleRef.value = undefined
      isActive.value = false
      toast.error('Failed to download bundle')
    }
  })
}

const bundles = computed(() => {
  return Array.from(gateway.state?.context.bundles.entries() || []).map(([hash, bundle]) => ({
    hash,
    uuid: bundle.uuid,
    product: bundle.product,
    last_modified: new Date(bundle.last_modified),
    used_by: [],
  }))
})

const devices = computed(() => {
  return Array.from(gateway.state?.context.bundles.entries() || []).map(([hash, bundle]) => ({
    hash,
    uuid: bundle.uuid,
    product: bundle.product,
    last_modified: new Date(bundle.last_modified),
    used_by: [],
  }))
})

onMounted(() => {
  setTimeout(() => {
    gateway.send({ type: 'REFRESH_DEVICES' })
    gateway.send({ type: 'REFRESH_BUNDLES' })
  }, 500)
})
</script>

<template>
  <v-card class="ma-2">
    <template #title>
      Upload bundle to the gateway
    </template>
    <template #text>
      <v-file-input
        v-model="inputUploadBundle"
        multiple
        label="Open .ddf bundle from disk"
        accept=".ddf"
      />
      <v-btn @click="upload()">
        Upload
      </v-btn>
    </template>
  </v-card>

  <v-card class="ma-2">
    <v-card-title class="d-flex">
      Devices
      <v-spacer />
      <v-btn
        class="ma-2"
        color="secondary"
        variant="outlined"
        :disabled="!gateway.state?.can({ type: 'REFRESH_DEVICES' })"
        @click="gateway.send({ type: 'REFRESH_DEVICES', manual: true })"
      >
        Refresh
      </v-btn>
    </v-card-title>
    <v-card-text>
      WIP
    </v-card-text>
  </v-card>

  <v-card v-if="app.settings?.developerMode" class="ma-2">
    <v-card-title class="d-flex">
      Installed DDF Bundles
      <v-spacer />
      <v-btn
        class="ma-2"
        color="secondary"
        variant="outlined"
        :disabled="!gateway.state?.can({ type: 'REFRESH_BUNDLES' })"
        @click="gateway.send({ type: 'REFRESH_BUNDLES', manual: true })"
      >
        Refresh
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-text-field
        v-model="search"
        placeholder="Search"
        append-inner-icon="mdi-close"
        label="Search"
        single-line
        hide-details
        @click:append-inner="search = ''"
      />
      <v-data-table
        :loading="isLoading"
        :search="search"
        :headers="[{
          title: 'Hash',
          key: 'hash',
        }, {
          title: 'Product',
          key: 'product',
        }, {
          title: 'Last Modified',
          key: 'last_modified',
        }, {
          title: 'Actions',
          key: 'actions',
        }]"
        :sort-by="[{
          key: 'last_modified',
          order: 'desc',
        }]"
        :items="bundles"
        item-value="hash"
      >
        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #item.hash="{ item }">
          <v-chip class="ma-2" color="grey">
            {{ item.hash.slice(0, 10) }}
          </v-chip>
        </template>

        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #item.last_modified="{ item }">
          <v-tooltip :text="`${item.last_modified.toLocaleDateString()} ${item.last_modified.toLocaleTimeString()}`">
            <template #activator="{ props: localProps }">
              <p v-bind="localProps">
                <UseTimeAgo v-slot="{ timeAgo }" :time="item.last_modified">
                  {{ timeAgo }}
                </UseTimeAgo>
              </p>
            </template>
          </v-tooltip>
        </template>
        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #item.actions="{ item }">
          <v-tooltip text="Inspect">
            <template #activator="{ props: localProps }">
              <v-btn v-bind="localProps" icon="mdi-magnify" size="small" @click="inspect(item.hash)" />
            </template>
          </v-tooltip>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>

  <v-dialog v-model="isActive">
    <template #default>
      <v-card title="Inspect Bundle">
        <v-card-text>
          <bundle-editor
            v-if="bundleRef" v-model="bundleRef" variant="outlined" class="ma-2"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />

          <v-btn
            text="Close Dialog"
            @click="isActive = false"
          />
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": false
  }
}
</route>
