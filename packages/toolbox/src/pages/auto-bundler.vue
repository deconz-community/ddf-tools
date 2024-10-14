<script setup lang="ts">
import type { Bundle, Source } from '@deconz-community/ddf-bundler'
import { buildFromFiles, createSource, encode } from '@deconz-community/ddf-bundler'
import saveAs from 'file-saver'
import type { Language } from '~/components/card/card-file-upload.vue'

const baseDEUrl = 'https://raw.githubusercontent.com/dresden-elektronik/deconz-rest-plugin/master/devices'

const genericDirectoryUrl = `${baseDEUrl}/generic`

const status = ref<'waitingForDDF' | 'loading' | 'missingFiles' | 'ready'>('waitingForDDF')

const ddfc = ref('')
const bundle = ref<ReturnType<typeof Bundle> | undefined>()

const extraFiles = ref<{
  path: string
  content: string
  title: string
  language: Language
}[]>([])

const missingFilesCount = computed(() => extraFiles.value.filter(file => !file.content).length)

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/\(.*?\)/g, '')
    .replace(/\W+/g, '')
    .replace(/_{2,}/g, '_')
    .replace(/^_+/, '')
    .replace(/_+$/, '')
}

async function build() {
  if (!ddfc.value) {
    status.value = 'waitingForDDF'
    return
  }

  status.value = 'loading'
  const sources = new Map<string, Source>()
  const ddfcBlob = new Blob([ddfc.value], { type: 'application/json' })

  const prefix = 'file://local/'

  const ddfcPath = `${prefix}ddf.json`

  sources.set(ddfcPath, createSource(ddfcBlob, {
    last_modified: new Date(),
    path: ddfcPath,
  }))

  const ddfcData = await sources.get(ddfcPath)!.jsonData
  let manufacturername: string = Array.isArray(ddfcData.manufacturername)
    ? ddfcData.manufacturername[0]
    : ddfcData.manufacturername

  if (typeof manufacturername === 'string') {
    if (manufacturername.startsWith('$MF_')) {
      manufacturername = manufacturername.replace('$MF_', '')
    }
    manufacturername = manufacturername.toLowerCase()
  }

  let newName = 'ddf'

  if (typeof ddfcData.product === 'string') {
    newName = slugify(ddfcData.product)
  }
  else if (typeof ddfcData.modelid === 'string') {
    newName = slugify(ddfcData.modelid)
  }
  else if (Array.isArray(ddfcData.modelid) && typeof ddfcData.modelid[0] === 'string') {
    newName = slugify(ddfcData.modelid[0])
  }

  const newDdfcPath = `${prefix}${newName}.json`

  sources.set(newDdfcPath, sources.get(ddfcPath)!)
  sources.delete(ddfcPath)

  const extraFilesList: string[] = []

  const newBundle = await buildFromFiles(
    genericDirectoryUrl,
    newDdfcPath,
    async (path) => {
      if (sources.has(path))
        return sources.get(path)!

      // #region Get extra file used by the DDF
      async function getExtraFile(path: string): Promise<Blob> {
        const result = extraFiles.value.find(file => file.path === path)
        if (result) {
          return new Blob([result.content])
        }

        const fileName = path.replace(prefix, '')

        let language: Language = 'plaintext'
        if (path.endsWith('.json')) {
          language = 'json'
        }
        else if (path.endsWith('.js')) {
          language = 'javascript'
        }
        else if (path.endsWith('.md')) {
          language = 'markdown'
        }

        const extraFile = {
          path,
          content: '',
          title: fileName,
          language,
        }

        try {
          const result = await fetch(`${baseDEUrl}/${manufacturername}/${fileName}`)
          if (result?.status === 200) {
            extraFile.content = await result.text()
          }
        }
        catch { }

        extraFiles.value.push(extraFile)
        extraFilesList.push(extraFile.path)

        return new Blob([extraFile.content])
      }
      // #endregion

      // #region Get generic files used by the DDF
      async function getGenericFile(path: string): Promise<Blob> {
        try {
          const result = await fetch(path)
          if (result?.status === 200) {
            return result.blob()
          }
        }
        catch {}

        const extraFile = {
          path,
          content: '',
          title: path.replace(`${baseDEUrl}/`, ''),
          language: 'json' as Language,
        }

        extraFiles.value.push(extraFile)
        extraFilesList.push(path)
        return new Blob([])
      }
      // #endregion

      const data = path.startsWith('file://')
        ? getExtraFile(path)
        : getGenericFile(path)

      const source = createSource(await data, {
        path,
        last_modified: new Date(),
      })
      sources.set(path, source)
      return source
    },
  )

  extraFiles.value = extraFiles.value.filter(file => extraFilesList.includes(file.path))

  if (extraFiles.value.some(file => file.content.length === 0)) {
    status.value = 'missingFiles'
    toast.error('Some extra files are missing, please provide them below.')
  }
  else {
    status.value = 'ready'
    toast.success('Bundle has been successfully created.')
  }

  newBundle.data.name = newName

  bundle.value = newBundle
}

async function download() {
  if (!bundle.value) {
    return toast.error('No bundle to download.')
  }

  bundle.value.sortFiles()
  bundle.value.generateDESC()

  saveAs(encode(bundle.value), `${bundle.value.data.name}.ddb`)
}

function reset() {
  ddfc.value = ''
  extraFiles.value = []
  status.value = 'waitingForDDF'
}

const debouncedBuild = useDebounceFn(() => build(), 500)

watch(ddfc, debouncedBuild)
</script>

<template>
  <v-card class="ma-2">
    <v-card-title class="d-flex">
      Auto Bundler
      <v-spacer />
      <v-btn
        color="error"
        text="Reset"
        @click="reset"
      />
    </v-card-title>
    <v-card-subtitle>
      Automatically create a bundle from a DDF JSON file and extra files.
    </v-card-subtitle>
    <v-card-text>
      <v-alert
        v-show="status === 'waitingForDDF'"
        type="info"
        class="ma-2"
        text="Please provide a DDF JSON file to create the bundle."
      />
      <v-alert
        v-show="missingFilesCount > 0"
        type="error"
        class="ma-2"
        text="Some extra files are missing, please provide them below."
      />
      <v-alert
        v-show="status === 'ready'"
        type="success"
        class="ma-2"
      >
        Bundle is ready for download.
        <v-btn text="Download" class="ma-1" color="primary" @click="download" />
      </v-alert>

      <card-file-upload
        v-model="ddfc"
        language="json"
        title="DDF JSON file"
      />

      <v-card v-show="extraFiles.length > 0">
        <v-card-title>
          Extra files
        </v-card-title>
        <v-card-text>
          <div
            v-for="file in extraFiles"
            :key="file.path"
          >
            <v-alert
              v-if="file.content.length === 0"
              type="error"
              class="ma-2"
              text="Missing file content"
            />
            <card-file-upload
              v-model="file.content"
              :language="file.language"
              :title="file.title"
              height="200px"
              @change="debouncedBuild()"
            />
          </div>
        </v-card-text>
      </v-card>
    </v-card-text>
    <v-card-actions>
      <v-btn
        color="success"
        :loading="status === 'loading'"
        :disabled="status !== 'ready'"
        text="Download bundle"
        size="large"
        variant="tonal"
        @click="download"
      />
    </v-card-actions>
  </v-card>
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": true
  }
}
</route>
