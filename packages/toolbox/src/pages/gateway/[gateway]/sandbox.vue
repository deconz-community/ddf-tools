<script setup lang="ts">
import { decode } from '@deconz-community/ddf-bundler'

const props = defineProps<{
  gateway: string
}>()

const machines = createUseAppMachine()
const gatewayMachine = machines.use('gateway', computed(() => ({ id: props.gateway })))

const files = ref<File[]>([])

async function upload() {
  const client = gatewayMachine.state?.context.gateway
  if (!client) {
    console.error('No client found')
    return
  }

  if (files.value.length === 0) {
    console.error('You should upload at least one bundle')
    return
  }

  console.log('uploading', files.value)

  files.value.map(async (file) => {
    const formData = new FormData()
    formData.append('ddfbundle', file)

    const result = await client?.uploadDDFBundle(formData)

    console.log('result', result)
  })
}

const data = ref<any>({})
const next = ref<string | number | undefined>('')

async function fetchNext() {
  const client = gatewayMachine.state?.context.gateway
  if (!client)
    console.error('No client found')

  const queries = next.value ? { next: next.value } : undefined

  const response = await client?.getDDFBundleDescriptors({
    queries,
  })

  if (!response)
    return console.error('No response found')

  data.value = response.success.descriptors
  next.value = response.success.next
}

const bundles = computed(() => {
  return Object.entries(data.value).map(([hash, value]) => {
    return {
      hash,
      ...value,
    }
  })
})

const isActive = ref(false)
const bundleRef = ref<any>()
async function inspect(hash: string) {
  const client = gatewayMachine.state?.context.gateway
  if (!client)
    console.error('No client found')

  const bundle = await client?.getDDFBundle({ params: { hash } })

  if (!bundle?.success)
    return console.error('No bundle found')

  bundleRef.value = await decode(bundle.success)
  isActive.value = true
}
</script>

<template>
  <v-card class="ma-2">
    <template #title>
      Sandbox
    </template>
    <template #text>
      <v-file-input
        v-model="files"
        multiple
        label="Open .ddf bundle from disk"
        accept=".ddf"
      />
      <v-btn @click="upload()">
        Upload
      </v-btn>
      <v-btn @click="fetchNext()">
        {{ next ? `Fetch next (${next})` : 'Fetch first' }}
      </v-btn>
    </template>
  </v-card>

  <v-card v-for="bundle in bundles" :key="bundle.hash" class="ma-2">
    <template #title>
      {{ bundle.product }}
      <v-btn @click="() => inspect(bundle.hash)">
        Inspect
      </v-btn>
    </template>

    <template #text>
      <pre>{{ bundle }}</pre>
    </template>
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
