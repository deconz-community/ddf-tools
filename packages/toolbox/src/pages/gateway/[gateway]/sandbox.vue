<script setup lang="ts">
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
      <pre>{{ data }}</pre>
    </template>
  </v-card>
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": false
  }
}
</route>
