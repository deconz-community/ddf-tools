<script setup>
const error = ref('')
const files = ref([])
const data = ref({})
const sha = ref('')

function getChunkTag(dat, offs) {
  return String.fromCharCode(
    dat.getUint8(offs + 0),
    dat.getUint8(offs + 1),
    dat.getUint8(offs + 2),
    dat.getUint8(offs + 3),
  )
}

function getChunkSize(dat, offs) {
  return dat.getUint32(offs, true) // little-endian
}

function utf8ToString(buf) {
  return new TextDecoder().decode(buf)
}

// only example to compute sha256 hash of the bundle
async function hash(buf) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buf)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray
    .map(bytes => bytes.toString(16).padStart(2, '0'))
    .join('')
  return hashHex
}

watch(files, async () => {
  error.value = ''
  data.value = {}
  sha.value = ''

  if (files.value.length !== 1)
    return

  const f = files.value[0]
  const buf = await f.arrayBuffer()
  const dat = new DataView(buf)
  let offs = 0
  let size = 0

  if (getChunkTag(dat, offs) !== 'RIFF') {
    error.value = 'not a RIFF file'
    return
  }

  offs += 4 // RIFF tag
  offs += 4 // chunk size

  if (getChunkTag(dat, offs) !== 'DDFB') {
    error.value = 'not a DDF bundle file'
    return
  }

  offs += 4 // DDFB tag

  // DESC chunk always first
  if (getChunkTag(dat, offs) !== 'DESC') {
    error.value = 'not a DESC section not found'
    return
  }

  offs += 4 // DESC tag
  size = getChunkSize(dat, offs)
  offs += 4 // size

  // DESC chunk holds a JSON object describing the bundle
  try {
    let desc = dat.buffer.slice(offs, offs + size)
    desc = utf8ToString(desc)
    data.value = JSON.parse(desc)
    sha.value = await hash(buf)
  }
  catch (e) {
    error.value = 'failed to parse DESC chunk JSON'
  }
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
