<script setup lang="ts">
import { type Bundle, decode } from '@deconz-community/ddf-bundler'

const error = ref('')
const sha = ref('')
const bundles = ref<ReturnType<typeof Bundle>[]>([])

const pb = useStore()

const files = ref<File[]>([])

watch(files, async () => {
  bundles.value = []
  files.value.forEach(async (file) => {
    bundles.value.push(markRaw(await decode(file)))
  })
})

/*
const upload = async () => {
  // Check if logged in
  if (pb.profile.value?.id === undefined)
    throw new Error('You must be logged in to upload a bundle')

  // TODO Check if bundle already exists

  // TODO Check if bundle is part of a tree

  // Find devices identifier in database for each device identifier in bundle
  const device_identifiers = await Promise.all(bundles.value.data.desc.device_identifiers.map(async (item: any) => {
    const record = await pb.findOrCreate('device_identifier', {
      manufacturername: item[0],
      modelid: item[1],
    }, {
      contributor: pb.profile.value!.id,
    })
    return record.id
  }))

  console.log(device_identifiers)

  console.log('upload')

  const formData = new FormData()

  formData.append('file', files.value[0])

  console.log(formData)
}
*/
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
    </template>
  </v-card>
  <template v-for="_, index in bundles" :key="index">
    <bundle-editor v-model="bundles[index]" />
  </template>
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": true
  }
}
</route>
