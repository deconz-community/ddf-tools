<script setup lang="ts">
import { type Bundle, decode } from '@deconz-community/ddf-bundler'
import { uploadFiles } from '@directus/sdk'

const error = ref('')
const sha = ref('')
const bundles = ref<ReturnType<typeof Bundle>[]>([])

const store = useStore()

const files = ref<File[]>([])

watch(files, async () => {
  bundles.value = []
  files.value.forEach(async (file) => {
    bundles.value.push(markRaw(await decode(file)))
  })
})

async function upload() {
  // Check if logged in
  if (store.state?.matches('online.connected') !== true)
    throw new Error('You must be logged in to upload a bundle')

  // TODO Check if bundle already exists

  // TODO Check if bundle is part of a tree

  console.log('upload')

  const formData = new FormData()

  files.value.forEach((file) => {
    // formData.append('folder', '4ae5d60d-cb46-41a1-93e4-a54bfc01a2a1')
    formData.append('bundle', file)
  })

  const result = await store.client?.request(uploadFiles(formData))
  /*
  const result = await store.client?.request(() => {
    return {
      path: '/upload',
      method: 'POST',
      body: formData,
    }
  })
  */

  /*
  const result = await store.client?.request('/upload', {
    method: 'POST',
    body: formData,
    headers: {
      // 'Content-Type': 'multipart/form-data',
    },
  })
  */

  console.log(result)
}
</script>

<template>
  <v-card class="ma-2">
    <template #title>
      Upload a DDF file
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
    </template>
  </v-card>

  <template v-for="_, index in bundles" :key="index">
    <bundle-editor v-model="bundles[index]" class="ma-2" />
  </template>
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": true
  }
}
</route>
