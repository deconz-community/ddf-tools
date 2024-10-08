<script setup lang="ts">
import type { RequestResultForAlias } from '@deconz-community/rest-client'
import { unzip } from 'fflate'

const props = defineProps<{
  gateway: string
}>()

const app = useApp()
const gateway = useGateway(toRef(props, 'gateway'))

const bundleSearch = ref('')
const deviceSearch = ref('')

const inputUploadBundle = ref<File[]>([])
const uploadInProgress = ref(false)
const uploadProgress = ref<number | null>(null)
const uploadCount = ref(0)

const isLoading = refDebounced(
  computed(() => !gateway.state?.matches({ online: { config: 'idle' } })),
  50,
)

async function fileToUint8Array(file: File): Promise<Uint8Array | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result === null
      ? null
      : new Uint8Array(reader.result as ArrayBuffer),
    )
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

async function extractZipFile(file: File) {
  const extractedFiles: File[] = []

  const blob = await fileToUint8Array(file)

  if (blob === null)
    throw new Error('Failed to read file')

  unzip(blob, (err, unzipped) => {
    if (err)
      throw err
    Object.entries(unzipped).forEach(([key, value]) => {
      if (key.endsWith('.ddb'))
        extractedFiles.push(new File([value], key))
    })
  })

  return extractedFiles
}

async function upload() {
  if (inputUploadBundle.value.length === 0)
    return toast.error('You should select at least one DDF bundle')
  uploadInProgress.value = true
  uploadProgress.value = 0
  uploadCount.value = inputUploadBundle.value.length

  const ddfToUpload: File[] = []

  // Extract zip files
  await Promise.all(inputUploadBundle.value.map(
    async (file) => {
      if (file.name.endsWith('.zip')) {
        const extractedFiles = await extractZipFile(file)
        ddfToUpload.push(...extractedFiles)
      }
      else {
        ddfToUpload.push(file)
      }
    },
  ))

  const results: RequestResultForAlias<'uploadDDFBundle'> = []

  // Upload DDF bundles
  uploadCount.value = ddfToUpload.length
  for (const [index, file] of ddfToUpload.entries()) {
    uploadProgress.value = index
    results.push(...await gateway.fetch('uploadDDFBundle', { body: file }))
    await new Promise(resolve => setTimeout(resolve, 42))
  }

  uploadInProgress.value = false

  const errors = results.filter(result => result.isErr())
  const successes = results.filter(result => result.isOk())

  if (errors.length > 0)
    toast.error(`Failed to ${errors.length} DDF ${errors.length > 1 ? 'bundles' : 'bundle'}`)

  if (successes.length > 0)
    toast.success(`Successfully uploaded ${successes.length} DDF ${successes.length > 1 ? 'bundles' : 'bundle'}`)

  setTimeout(() => {
    gateway.send({ type: 'REFRESH_DEVICES' })
  }, 2500)
}

const bundles = computed(() => {
  return Array.from(gateway.bundles?.entries() || []).map(([hash, bundle]) => ({
    hash,
    ...bundle,
  }))
})

const devices = computed(() => {
  return Array.from(gateway.devices?.entries() || []).map(([uniqueId, device]) => ({
    uniqueId,
    name: device.name,
    manufacturername: device.manufacturername,
    modelid: device.modelid,
    productid: device.productid,
    lastseen: device.lastseen,
    ddf_policy: device.ddf_policy,
    ddf_hash: device.ddf_hash ?? '',
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
        label="Open .ddb bundle or zip of .ddb bundles from disk"
        accept=".ddb,.zip"
      />
      <div class="d-flex">
        <v-btn
          :loading="uploadInProgress"
          color="secondary"
          variant="outlined"
          @click="upload()"
        >
          Upload
        </v-btn>
        <v-expand-transition>
          <v-progress-linear
            v-show="uploadInProgress"
            v-model="uploadProgress"
            :max="uploadCount"
            color="success"
            height="20"
            rounded
            striped
            class="ml-2 align-self-center"
          >
            <template #default>
              <strong>{{ uploadProgress }} / {{ uploadCount }}</strong>
            </template>
          </v-progress-linear>
        </v-expand-transition>
      </div>
    </template>
  </v-card>

  <v-card class="ma-2">
    <v-card-title class="d-flex">
      Devices DDF Bundles Policy
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
      <v-text-field
        v-model="deviceSearch"
        placeholder="Search"
        append-inner-icon="mdi-close"
        label="Search"
        single-line
        hide-details
        @click:append-inner="deviceSearch = ''"
      />

      <v-data-table
        :loading="isLoading"
        :search="deviceSearch"
        :headers="[{
          title: 'Name',
          key: 'name',
        }, {
          title: 'Product',
          key: 'productid',
        }, {
          title: 'DDF Policy',
          key: 'ddf_policy',
        }, {
          title: 'DDF Used',
          key: 'ddf_hash',
        }, {
          title: 'Actions',
          key: 'actions',
        }]"
        :sort-by="[{
          key: 'name',
          order: 'asc',
        }]"
        :items="devices"
        item-value="uniqueId"
      >
        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #item.productid="{ item }">
          <template v-if="item.productid">
            {{ item.productid }}
          </template>
          <template v-else>
            {{ item.manufacturername }} {{ item.modelid }}
          </template>
        </template>

        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #item.ddf_policy="{ item }">
          <chip-ddf-policy
            :gateway="props.gateway"
            :device-id="item.uniqueId"
            :device-name="item.name"
            :manufacturer-name="item.manufacturername"
            :model-id="item.modelid"
            :ddf-policy="item.ddf_policy"
            :ddf-hash="item.ddf_hash"
          />
        </template>

        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #item.ddf_hash="{ item }">
          <chip-ddf-hash
            v-if="item.ddf_hash"
            source="gateway"
            :hash="item.ddf_hash"
            :gateway="props.gateway"
          />
          <v-chip v-else class="ma-2" color="gray">
            Raw JSON
          </v-chip>
        </template>

        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #item.actions="{ item }">
          <v-tooltip text="Search for new DDF Bundle on the store">
            <template #activator="{ props: localProps }">
              <v-btn
                v-bind="localProps" icon="mdi-magnify" size="small" :to="{
                  path: '/store/search',
                  query: {
                    manufacturer: item.manufacturername,
                    model: item.modelid,
                  },
                }"
              />
            </template>
          </v-tooltip>
        </template>
      </v-data-table>
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
        v-model="bundleSearch"
        placeholder="Search"
        append-inner-icon="mdi-close"
        label="Search"
        single-line
        hide-details
        @click:append-inner="bundleSearch = ''"
      />
      <v-data-table
        :loading="isLoading"
        :search="bundleSearch"
        :headers="[{
          title: 'Hash',
          key: 'hash',
        }, {
          title: 'Product',
          key: 'product',
        }, {
          title: 'Last Modified',
          key: 'last_modified',
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
          <chip-ddf-hash
            source="gateway"
            :hash="item.hash"
            :gateway="props.gateway"
          />
        </template>

        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #item.last_modified="{ item }">
          <v-tooltip :text="`${item.last_modified.toLocaleDateString()} ${item.last_modified.toLocaleTimeString()}`">
            <template #activator="{ props: localProps }">
              <p v-bind="localProps">
                <UseTimeAgo v-slot="{ timeAgo }" :time="item.last_modified">
                  {{ timeAgo }}
                </UseTimeAgo>
                <br>
                ({{ item.last_modified.toLocaleDateString() }})
              </p>
            </template>
          </v-tooltip>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<route lang="json">
{
  "meta": {
    "layout": "gateway",
    "requireAPI" : ">=2.27.1",
    "hideLevelTwoSidebar": false
  }
}
</route>
