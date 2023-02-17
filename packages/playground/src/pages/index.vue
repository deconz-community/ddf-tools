<script setup lang="ts">
import { Bundle } from 'ddf-bundler'
import { saveAs } from 'file-saver'

const error = ref('')
const files = ref<File[]>([])
const sha = ref('')

const bundle = shallowRef(Bundle())

const parseFile = async () => {
  error.value = ''
  sha.value = ''

  if (files.value.length === 0)
    return
  await bundle.value.parseFile(files.value[0])
  triggerRef(bundle)
}

const makeBundle = async () => {
  const data = await bundle.value.makeBundle()
  const blob = new Blob([data])
  saveAs(blob, 'bundle.ddf')
}

watch(files, parseFile)

const desc = computed(() => {
  return JSON.stringify(bundle.value.data.desc, null, 4)
})
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
          Following shows the bundle
          <strong>DESC</strong> chunk content, which is a JSON object.
          <br>As an example the unique SHA256 hash is calculated over the bundle.
        </p>
      </v-alert>

      <v-alert v-show="error" class="ma-2" type="error" title="Error" :text="error" />

      <v-file-input v-model="files" label="Select .ddf file:" accept=".ddf" />

      <v-btn
        prepend-icon="mdi-download"
        color="blue-grey"
        @click="makeBundle()"
      >
        Download Bundle
      </v-btn>

      <!--
      <json-viewer :value="bundle.data"></json-viewer>

      <v-text-field v-model="sha" label="SHA256" readonly />
      -->

      <v-card>
        <template #title>
          DESC
        </template>
        <template #text>
          <codemirror
            v-model="desc"
            placeholder="Code goes here..."
            :autofocus="true"
            :indent-with-tab="true"
            :tab-size="2"
          />
        </template>
      </v-card>

      <v-card>
        <template #title>
          DDFC
        </template>
        <template #text>
          <codemirror
            v-model="bundle.data.ddfc"
            placeholder="Code goes here..."
            :autofocus="true"
            :indent-with-tab="true"
            :tab-size="2"
          />
        </template>
      </v-card>

      <v-card v-for="index in bundle.data.files.length" :key="index">
        <template #title>
          {{ bundle.data.files[index - 1].path }}
        </template>
        <template #text>
          <codemirror
            v-model="bundle.data.files[index - 1].data"
            placeholder="Code goes here..."
            :autofocus="true"
            :indent-with-tab="true"
            :tab-size="2"
          />
        </template>
      </v-card>
    </template>
  </v-card>
</template>
