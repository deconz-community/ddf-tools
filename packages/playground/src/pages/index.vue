<script setup lang="ts">
import { Bundle } from 'ddf-bundler'

const error = ref('')
const files = ref<File[]>([])
const data = ref({})
const sha = ref('')

const bundle = shallowReactive(Bundle())

const parseFile = async () => {
  error.value = ''
  data.value = {}
  sha.value = ''

  if (files.value.length === 0)
    return

  data.value = await bundle.parseFile(files.value[0])
}

watch(files, parseFile)
</script>

<template>
  <v-card width="100%" class="ma-2">
    <template #title>
      DDF Bundle
    </template>

    <template #text>
      <v-alert class="ma-2">
        <p>This is a small HTML/JS to test reading the RIFF based DDF bundle.</p>
        <p>
          Following shows the bundle <strong>DESC</strong> chunk content, which is a JSON object.<br>
          As an example the unique SHA256 hash is calculated over the bundle.
        </p>
      </v-alert>

      <v-alert
        v-show="error"
        class="ma-2"
        type="error"
        title="Error"
        :text="error"
      />

      <v-file-input
        v-model="files"
        label="Select .ddf file:"
        accept=".ddf"
      />

      <v-btn @click="parseFile()">
        Refresh
      </v-btn>

      <json-viewer
        v-if="data"
        :value="data"
        :expand-depth="3"
      />

      <v-text-field
        v-model="sha"
        label="SHA256"
        readonly
      />
    </template>
  </v-card>
</template>
