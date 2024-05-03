<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid'
import { type Bundle, decode } from '@deconz-community/ddf-bundler'

import type { PrimaryKey } from '@directus/types'

// TODO migrate to @deconz-community/types
type UploadResponse = Record<string, {
  success: boolean
  createdId?: PrimaryKey
  message?: string
}>

const error = ref('')
const sha = ref('')
const bundles = ref<ReturnType<typeof Bundle>[]>([])
const store = useStore()
const files = ref<File[]>([])
const defaultState = ref('alpha')

watch(files, async () => {
  bundles.value = []
  files.value.forEach(async (file) => {
    bundles.value.push(markRaw(await decode(file)))
  })
})

async function upload() {
  // Check if logged in
  if (store.state?.matches({ online: { auth: 'connected' } }) !== true)
    throw new Error('You must be logged in to upload a bundle')

  // TODO Check if bundle already exists

  // TODO Check if bundle is part of a tree

  const formData = new FormData()
  files.value.forEach((file) => {
    formData.append(uuidv4(), file)
  })

  // const result = await store.client?.request(uploadFiles(formData))
  const result = await store.client?.request<{ result: UploadResponse }>(() => {
    return {
      method: 'POST',
      path: `/bundle/upload/${defaultState.value}`,
      body: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  })

  if (result) {
    const results = Object.entries(result.result)

    const goodResults = results.filter(([_, value]) => value.success)
    const badResults = results.filter(([_, value]) => !value.success)

    if (goodResults.length > 0)
      toast.success(`${goodResults.length} bundles uploaded successfully`)

    if (badResults.length > 0) {
      badResults.forEach(([key, value]) => {
        toast.error(formData.get(key)?.name ?? 'Bundle', {
          description: value.message,
        })
      })
    }
  }
  // files.value = []
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
    <template #actions>
      <v-btn-toggle
        v-model="defaultState"
        mandatory
        divided
        variant="outlined"
      >
        <v-btn
          value="alpha"
          prepend-icon="mdi-tag-outline"
          text="Alpha"
          color="red"
          :width="100"
        />
        <v-btn
          value="beta"
          prepend-icon="mdi-tag-outline"
          text="Beta"
          color="orange"
          :width="100"
        />
        <v-btn
          value="stable"
          prepend-icon="mdi-tag-outline"
          text="Stable"
          color="green"
          :width="100"
        />
      </v-btn-toggle>
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
