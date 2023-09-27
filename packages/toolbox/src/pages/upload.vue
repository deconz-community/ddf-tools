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
    formData.append('file', file)
  })

  const result = await store.client?.request(uploadFiles(formData))

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
