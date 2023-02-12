<script setup>
onMounted(() => {
  const inp = document.querySelector('input[type=file]')
  const ddfdesc = document.querySelector('#ddfdesc')

  function showError(err) {
    ddfdesc.textContent = err
  }

  function getChunkTag(dat, offs) {
    return String.fromCharCode(dat.getUint8(offs + 0), dat.getUint8(offs + 1), dat.getUint8(offs + 2), dat.getUint8(offs + 3))
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

  // 'json' contains the DDF bundle description
  // which holds all data needed for matching, indexing, catalogue
  function handleDescriptionJson(json, hashSha256) {
    let para = document.createElement('pre')
    para.innerText = JSON.stringify(json, null, 2)
    ddfdesc.appendChild(para)

    para = document.createElement('pre')
    para.innerText = `File-Sha256: ${hashSha256}`
    ddfdesc.appendChild(para)
  }

  async function loadBundle() {
    if (this.files.length !== 1)
      return

    const f = this.files[0]
    const buf = await f.arrayBuffer()
    const dat = new DataView(buf)
    let offs = 0
    let size = 0

    if (getChunkTag(dat, offs) != 'RIFF') {
      showError('not a RIFF file')
      return
    }

    offs += 4 // RIFF tag
    offs += 4 // chunk size

    if (getChunkTag(dat, offs) !== 'DDFB') {
      showError('not a DDF bundle file')
      return
    }

    offs += 4 // DDFB tag

    // DESC chunk always first
    if (getChunkTag(dat, offs) !== 'DESC') {
      showError('not a DESC section not found')
      return
    }

    offs += 4 // DESC tag
    size = getChunkSize(dat, offs)
    offs += 4 // size

    // DESC chunk holds a JSON object describing the bundle
    try {
      let desc = dat.buffer.slice(offs, offs + size)
      desc = utf8ToString(desc)
      const sha256hash = await hash(buf)
      handleDescriptionJson(JSON.parse(desc), sha256hash)
    }
    catch (e) {
      showError('failed to parse DESC chunk JSON')
    }
  }

  inp.addEventListener('change', loadBundle)
})
</script>

<template>
  <v-card width="100%" class="ma-2">
    <template #title>
      DDF Bundle
    </template>

    <template #text>
      <p>This is a small HTML/JS to test reading the RIFF based DDF bundle.</p>
      <p>
        Following shows the bundle <strong>DESC</strong> chunk content, which is a JSON object.<br>
        As an example the unique SHA256 hash is calculated over the bundle.
      </p>
      <label for="mfile">Select .ddf file: </label>
      <input id="mfile" type="file" name="mfile" accept=".ddf">

      <div id="ddfdesc" />
    </template>
  </v-card>
</template>

<style scoped>
body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
        margin: 2rem 2rem;
      }
      #ddfdesc {
        max-width: 45rem;
        min-height: 12rem;
        margin: 1rem 0rem;
      }
</style>
