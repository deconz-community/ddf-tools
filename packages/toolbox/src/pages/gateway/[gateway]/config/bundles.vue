<script setup lang="ts">
import { decode } from '@deconz-community/ddf-bundler'

const props = defineProps<{
  gateway: string
}>()

const machines = createUseAppMachine()
const gateway = machines.use('gateway', computed(() => ({ id: props.gateway })))
const search = ref('')
const inputUploadBundle = ref<File[]>([])

const isLoading = refDebounced(
  computed(() => !gateway.state?.matches({ online: { config: 'idle' } })),
  50,
)

async function upload() {
  const client = gateway.state?.context.gateway
  if (!client) {
    console.error('No client found')
    return
  }

  if (inputUploadBundle.value.length === 0) {
    console.error('You should upload at least one bundle')
    return
  }

  await Promise.all(inputUploadBundle.value.map(async (file) => {
    const formData = new FormData()
    formData.append('ddfbundle', file)

    const result = await client?.uploadDDFBundle(formData)

    console.log('result', result)
  }))

  gateway.send({ type: 'REFRESH_BUNDLES' })
}

const isActive = ref(false)
const bundleRef = ref<any>()
async function inspect(hash: string) {
  const client = gateway.state?.context.gateway
  if (!client)
    console.error('No client found')

  const bundle = await client?.getDDFBundle({ params: { hash } })

  if (!bundle?.success)
    return console.error('No bundle found')

  bundleRef.value = await decode(bundle.success)
  isActive.value = true
}

const bundles = computed(() => {
  return Array.from(gateway.state?.context.bundles.entries() || []).map(([hash, bundle]) => ({
    hash,
    product: bundle.product,
    last_modified: new Date(bundle.last_modified),
  }))
})

onMounted(() => {
  setTimeout(() => {
    gateway.send({ type: 'REFRESH_BUNDLES' })
  }, 200)
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
    <v-card-title>
      Manage Bundles
      <v-btn
        class="ma-2"
        :disabled="!gateway.state?.can({ type: 'REFRESH_BUNDLES' })"
        @click="gateway.send({ type: 'REFRESH_BUNDLES' })"
      >
        Refresh
      </v-btn>
      <v-spacer />
      <v-text-field
        v-model="search"
        placeholder="Search"
        append-inner-icon="mdi-close"
        label="Search"
        single-line
        hide-details
        @click:append-inner="search = ''"
      />
    </v-card-title>
    <v-card-text>
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
            {{ item.hash.slice(-10) }}
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
