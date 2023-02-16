<script setup lang="ts">
import { Bundle } from 'ddf-bundler'
import { saveAs } from 'file-saver';


const error = ref('')
const files = ref<File[]>([])
const sha = ref('')

const bundle = reactive(Bundle())

const parseFile = async () => {
  error.value = ''
  sha.value = ''

  if (files.value.length === 0)
    return

  await bundle.parseFile(files.value[0])
}

const makeBundle = async()=>{
  const data = await bundle.makeBundle()
  const blob = new Blob([data])
  saveAs(blob, 'bundle.ddf')
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

      
      <v-btn @click="makeBundle()">
        Make Bundle
      </v-btn>

      <json-viewer :value="bundle.data"></json-viewer>
      


      <v-text-field
        v-model="sha"
        label="SHA256"
        readonly
      />
    </template>
  </v-card>
</template>
