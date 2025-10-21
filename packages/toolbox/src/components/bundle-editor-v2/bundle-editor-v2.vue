<script setup lang="ts">
import type { BundleFile, TextFile } from '@deconz-community/ddf-bundler'
import type { VueMonacoEditorEmitsOptions } from '@guolao/vue-monaco-editor'
import type { VListItem } from 'vuetify/lib/components/index.mjs'
import type { Node } from '~/lib/filePathsToTree'
import { Bundle, decode, encode } from '@deconz-community/ddf-bundler'
import { createValidator } from '@deconz-community/ddf-validator'
import { bytesToHex } from '@noble/hashes/utils.js'
import { useVModel } from '@vueuse/core'
import { saveAs } from 'file-saver'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { filePathsToTree } from '~/lib/filePathsToTree'
import { duktapeJS } from './duktapeJS'

type Editor = Parameters<VueMonacoEditorEmitsOptions['mount']>[0]
type Monaco = Parameters<VueMonacoEditorEmitsOptions['mount']>[1]

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  modelValue: ReturnType<typeof Bundle>
}>()

const emit = defineEmits(['update:modelValue'])

const bundle = useVModel(props, 'modelValue', emit)
const isDirty = ref(false)
const codeEditor = shallowRef<Editor>()
const monacoEditor = shallowRef<Monaco>()
const schema = shallowRef(zodToJsonSchema(createValidator().getSchema()))

function updateSchema() {
  const validator = createValidator()

  validator.bulkValidate(
    // Generic files
    bundle.value.data.files
      .filter(file => file.type === 'JSON')
      .map((file) => {
        return {
          path: file.path,
          data: JSON.parse(file.data as string),
        }
      }),
    // DDF file
    [],
  )

  schema.value = zodToJsonSchema(validator.getSchema())
}

// #region Constants

const icons = {
  json: {
    icon: 'mdi-code-json',
    color: '#2ecc71',
  },
  javascript: {
    icon: 'mdi-language-javascript',
    color: '#3498db',
  },
  markdown: (type: string) => {
    let color = '#ecf0f1'
    switch (type) {
      case 'CHLG':
        color = '#3498db'
        break
      case 'INFO':
        color = '#2ecc71'
        break
      case 'WARN':
        color = '#f1c40f'
        break
      case 'KWIS':
        color = '#e74c3c'
        break
    }

    return {
      icon: 'mdi-language-markdown',
      color,
    }
  },
} as const

const filesTypes = [
  { type: 'DDFC', ...icons.json, ext: 'json', desc: 'JSON DDF File', format: 'json' },
  { type: 'SCJS', ...icons.javascript, ext: 'js', desc: 'Javascript file for read, write or parse', format: 'javascript' },
  { type: 'JSON', ...icons.json, ext: 'json', desc: 'Generic files for items / constants', format: 'json' },
  { type: 'CHLG', ...icons.markdown('CHLG'), ext: 'md', desc: 'Changelog', format: 'markdown' },
  { type: 'INFO', ...icons.markdown('INFO'), ext: 'md', desc: 'Informational note', format: 'markdown' },
  { type: 'WARN', ...icons.markdown('WARN'), ext: 'md', desc: 'Warning note', format: 'markdown' },
  { type: 'KWIS', ...icons.markdown('KWIS'), ext: 'md', desc: 'Know issue', format: 'markdown' },
] as const

// #endregion

// #region Left Menu
const showLeftMenu = ref(true)
const selectedLeftMenu = ref(['readme'])

watch(selectedLeftMenu, (newValue, oldValue) => {
  if (newValue[0] === undefined)
    selectedLeftMenu.value = oldValue

  if (isDirty.value && newValue[0] === 'readme')
    bundle.value.generateDESC()
})

const isFileSelected = computed(() => selectedLeftMenu.value[0]?.startsWith('file://'))

const fileTree = computed(() => filePathsToVuetifyList(
  bundle.value.data.files.map(file => file.path),
  node => bundle.value.data.files.find(file => file.path === node.path)!,
))

type FileListItem = {
  type: 'divider'
} | {
  type: 'subheader'
  title: string
} | {
  title: string
  value: string
  data?: {
    errorCount?: number
    isDirectory?: boolean
    icon?: string
    iconColor?: string
  }
  props?: VListItem['$props']
  children?: FileListItem[]
}

function filePathsToVuetifyList(paths: string[], getData?: (node: Node<TextFile>) => TextFile) {
  // TODO: Fix when path start with ../
  function convertLeaf(node: Node<TextFile>): FileListItem {
    const data: (FileListItem & { type: undefined })['data'] = {
      errorCount: 0,
      isDirectory: true,
    }

    if (node.data) {
      data.isDirectory = false
      const fileType = filesTypes.find(type => type.type === node.data!.type)
      if (fileType) {
        data.icon = fileType.icon
        data.iconColor = fileType.color
      }
      else {
        data.icon = 'mdi-file'
        data.iconColor = 'grey'
      }
    }

    const path = data.isDirectory
      ? `folder://${node.path}`
      : `file://${node.path}`

    let lastClickTime = 0

    return {
      title: node.name,
      value: path,
      data,
      props: {
        key: path,
        onClick: () => {
          const currentTime = new Date().getTime()
          const timeDiff = currentTime - lastClickTime
          const isDoubleClick = timeDiff < 500 && timeDiff > 0
          openFile(path, { isPersistent: isDoubleClick })
          lastClickTime = currentTime
        },
      },
      children: node.children.length > 0 ? node.children.map(convertLeaf) : undefined,
    }
  }

  return filePathsToTree<TextFile>(paths, getData).map(convertLeaf)
}

const leftMenu = computed(() => {
  const menu: FileListItem[] = []

  menu.push({ type: 'subheader', title: `${bundle.value.data.name}.ddb` })
  menu.push({
    title: 'Read Me',
    value: 'readme',
    data: {
      icon: 'mdi-book-open',
      iconColor: '#16a085',
    },
  })
  menu.push({ type: 'subheader', title: 'Content' })

  menu.push(...fileTree.value)

  menu.push({ type: 'divider' })

  return menu
})

// #endregion

// #region File editor

interface EditedFile {
  sourceFile: BundleFile
  data: string
  icon?: string
  iconColor?: string
  isPersistent: boolean
  isDirty: boolean
  isDisplayed: boolean
}

const newFileData: EditedFile = {
  sourceFile: {
    type: 'SCJS',
    path: 'new_file.js',
    last_modified: new Date(),
    data: '',
  },
  data: '',
  icon: 'mdi-file-plus',
  isPersistent: false,
  isDirty: true,
  isDisplayed: true,
} as const

const openedFiles = ref<EditedFile[]>([])
// Any displayed file need to be in the openedFiles array
const displayedFile = ref<EditedFile>(structuredClone(newFileData))
const displayedFileIndex = ref(0)

watch(displayedFile, (newDisplayedFile, oldDisplayedFile) => {
  if (oldDisplayedFile) {
    oldDisplayedFile.isDisplayed = false
  }

  openedFiles.value = openedFiles.value.filter(file => file.isPersistent || file === newDisplayedFile)

  if (newDisplayedFile) {
    selectedLeftMenu.value = [`file://${newDisplayedFile.sourceFile.path}`]
    displayedFileIndex.value = openedFiles.value.findIndex(file => file === newDisplayedFile)
    newDisplayedFile.isDisplayed = true
    if (newDisplayedFile.sourceFile.type === 'DDFC') {
      updateSchema()
    }
  }
  else {
    displayedFile.value = structuredClone(newFileData)
    selectedLeftMenu.value = ['readme']
  }
})

// #endregion

// #region Top Menu

const topMenu = [
  {
    title: 'Bundle',
    items: [
      {
        title: 'New bundle',
        props: {
          prependIcon: 'mdi-file',
          onClick: () => createNew(),
        },
      },
      {
        title: 'Open from disk',
        props: {
          prependIcon: 'mdi-folder-open',
          onClick: async () => {
            const scope = effectScope()
            scope.run(() => {
              const { open, onCancel, onChange } = useFileDialog({
                multiple: false,
                accept: '.ddb',
                directory: false,
              })

              onChange(async (files) => {
                if (files !== null && files.length === 1) {
                  bundle.value = await decode(files[0])
                }

                scope.stop()
              })

              onCancel(scope.stop)

              open()
            })
          },
        },
      },
      {
        title: 'Download',
        props: {
          prependIcon: 'mdi-download',
          onClick: () => {
            saveAs(encode(bundle.value), `${bundle.value.data.name}.ddb`)
          },
        },
      },
    ],
  },
  {
    title: 'File',
    items: [
      {
        title: 'New file',
        props: {
          prependIcon: 'mdi-file-plus',
        },
        children: filesTypes.filter(fileType => fileType.type !== 'DDFC').map((fileType) => {
          return {
            title: fileType.desc,
            props: {
              prependIcon: fileType.icon,
              onClick: () => newFile(fileType.type),
            },
          }
        }),
      },
      {
        title: 'Save',
        props: {
          prependIcon: 'mdi-content-save',
          onClick: () => saveFile(displayedFileIndex.value),
        },
      },
      {
        title: 'Close',
        props: {
          prependIcon: 'mdi-close',
          onClick: () => closeFile(displayedFile.value.sourceFile.path),
        },
      },
    ],
  },
]

// #endregion

// #region Read Me

const markdownFilesTypes = {
  CHLG: 'Changelog',
  INFO: 'Information',
  WARN: 'Warning',
  KWIS: 'Known issue',
} as const

const markdownFiles = computed(() => {
  if (!bundle.value)
    return []
  return bundle.value.data.files.filter(file => objectKeys(markdownFilesTypes).includes(file.type as any))
})

const timeAgo = useTimeAgo(() => bundle.value.data.desc.last_modified)

const hash = computed(() => {
  return bytesToHex(bundle.value.data.hash ?? new Uint8Array())
})

// #endregion

// #region Actions
async function createNew() {
  // closeAllFiles()
  const newBundle = Bundle()

  newBundle.data.files.push({
    type: 'DDFC',
    data: JSON.stringify(
      {
        schema: 'devcap1.schema.json',
        manufacturername: 'Sample Manufacturer',
        modelid: 'Sample model id',
        status: 'Draft',
        subdevices: [],
      },
      null,
      2,
    ),
    path: 'new_bundle.json',
    last_modified: new Date(),
  })
  bundle.value = newBundle
}

function newFile(type: TextFile['type'] = 'SCJS') {
  // TODO check if the DDFC is open and not saved
  openedFiles.value
    .filter(file => file.sourceFile.type === 'DDFC' && file.isDirty)
    .map(file => saveFile(file.sourceFile.path))

  const fileType = filesTypes.find(fileType => fileType.type === type)

  if (!fileType) {
    console.error(`File type not found: ${type}`)
    return
  }

  let path = `new_file.${fileType?.ext}`

  if (bundle.value.data.files.some(file => file.path === path)) {
    let i = 1
    while (bundle.value.data.files.some(
      file => file.path === `new_file_${i}.${fileType?.ext}`,
    )) { i++ }
    path = `new_file_${i}.${fileType?.ext}`
  }

  const newFileData = {
    type,
    path,
    last_modified: new Date(),
    data: '',
  }

  bundle.value.data.files.push(newFileData)

  /*
  TODO: Add the file to the DDFC file
  switch (type) {
    case 'CHLG':{
      const ddfcFile = bundle.value.data.files.find(file => file.type === 'DDFC')
      if (!ddfcFile) {
        console.error('DDFC file not found')
        return
      }

      const ddfcPath = ddfcFile.path
      const file = openFile(ddfcPath)

      if (!file) {
        console.error('DDFC file not found')
        return
      }

      const ddfc = JSON.parse(file.data)
      if (ddfc['md:changelogs'] === undefined) {
        ddfc['md:changelogs'] = [newFileData.path]
      }
      else {
        ddfc['md:changelogs'].push(newFileData.path)
      }

      file.data = JSON.stringify(ddfc, null, 2)
    }
      break
  }
      */

  bundle.value.sortFiles()

  openFile(newFileData.path, { isPersistent: true })
}

function openFile(path: string, { isPersistent = false, isDisplayed = true } = {}): EditedFile | undefined {
  if (path.startsWith('file://')) {
    path = path.replaceAll('/__parent_directory__/', '/../').replace('file://', '')
  }

  const alreadyOpenedFile = openedFiles.value.find(candidate => candidate.sourceFile.path === path)

  if (alreadyOpenedFile) {
    alreadyOpenedFile.isPersistent = alreadyOpenedFile.isPersistent || isPersistent

    if (isDisplayed && displayedFile.value !== alreadyOpenedFile) {
      displayedFile.value = alreadyOpenedFile
    }

    return alreadyOpenedFile
  }

  const sourceFile = bundle.value.data.files.find(candidate => candidate.path === path)

  if (!sourceFile) {
    console.error(`File not found: ${path}`)
    return
  }

  const fileInTree = fileTree.value.find(candidate => !('type' in candidate) && candidate.value === path) as (FileListItem & { type: undefined }) | undefined
  const openingFile: EditedFile = {
    sourceFile,
    data: sourceFile.data,
    icon: fileInTree?.data?.icon,
    iconColor: fileInTree?.data?.iconColor,
    isPersistent,
    isDirty: false,
    isDisplayed: false, // Will be updated lated by the displayedFile watcher
  }

  openedFiles.value.push(openingFile)

  if (isDisplayed) {
    displayedFile.value = openingFile
  }

  return openingFile
}

function saveFile(pathOrOpenedFileIndex: string | number) {
  const savingFileIndex = typeof pathOrOpenedFileIndex === 'number'
    ? pathOrOpenedFileIndex
    : openedFiles.value.findIndex(candidate => candidate.sourceFile.path === pathOrOpenedFileIndex)

  const savingFile = openedFiles.value[savingFileIndex]

  if (!savingFile) {
    console.error(`File not found: ${pathOrOpenedFileIndex}`)
    return
  }
  savingFile.sourceFile.data = savingFile.data
  savingFile.sourceFile.last_modified = new Date()
  savingFile.isDirty = false

  isDirty.value = true
}

function renameFile(oldPath: string, newPath: string) {
  console.warn('TODO: renameFile', oldPath, newPath)
}

function closeFile(path: string, saveBeforeClose = false) {
  // TODO add a confirmation dialog

  const closingIndex = openedFiles.value.findIndex(candidate => candidate.sourceFile.path === path)

  if (closingIndex === -1) {
    console.error(`File not found: ${path}`)
    return
  }

  if (saveBeforeClose)
    saveFile(closingIndex)

  if (openedFiles.value[closingIndex].isDisplayed) {
    displayedFile.value = openedFiles.value[closingIndex - 1] ?? openedFiles.value[closingIndex + 1]
  }

  openedFiles.value.splice(closingIndex, 1)
}

function closeAllFiles() {
  openedFiles.value.forEach(file => closeFile(file.sourceFile.path))
}

function fileChanged() {
  if (displayedFile.value.isDirty === false)
    displayedFile.value.isDirty = true

  if (displayedFile.value.isPersistent === false)
    displayedFile.value.isPersistent = true
}

watchImmediate(bundle, () => {
  openedFiles.value = []

  const DDFCPath = bundle.value.data.files.find(file => file.type === 'DDFC')?.path
  const SCJSPath = bundle.value.data.files.find(file => file.type === 'SCJS')?.path
  openFile(`file://${DDFCPath}`, { isPersistent: true })
  if (SCJSPath)
    openFile(`file://${SCJSPath}`, { isPersistent: true })
  openFile(`file://${DDFCPath}`)
})

const handleMonacoEditorMount: VueMonacoEditorEmitsOptions['mount'] = (editor, monaco) => {
  codeEditor.value = editor
  monacoEditor.value = monaco
  const { languages } = monaco
  const jsonLanguageId = languages.json.jsonDefaults.languageId

  editor.addAction({
    id: 'save-file',
    label: 'Save file',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
    run: () => saveFile(displayedFileIndex.value),
  })

  editor.addAction({
    id: 'close-file',
    label: 'Close file',
    run: () => closeFile(displayedFile.value.sourceFile.path),
  })

  filesTypes.forEach((fileType) => {
    editor.addAction({
      id: `new-file-${fileType.type}`,
      label: `New File : ${fileType.desc}`,
      run: () => newFile(fileType.type),
    })
  })

  languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
  })

  languages.typescript.javascriptDefaults.setCompilerOptions({
    target: languages.typescript.ScriptTarget.ES5,
    allowNonTsExtensions: true,
    allowJs: true,
    lib: ['es5'],
  })

  languages.typescript.javascriptDefaults.addExtraLib(duktapeJS(), 'duktape.d.ts')

  languages.registerTypeDefinitionProvider(jsonLanguageId, {
    provideTypeDefinition: async (model, position, token) => {
      // TODO open the generic file in the editor
      // It's the right click + go to type definition feature
      console.log('provideTypeDefinition', model, position, token)
      return null
    },
  })

  languages.registerHoverProvider(jsonLanguageId, {
    provideHover: async (model, position, token) => {
      // console.log('provideHover', model, position, token)
      return null
    },
  })

  languages.registerInlayHintsProvider(jsonLanguageId, {
    provideInlayHints: async (model, range, token) => {
      // console.log('provideInlayHints', model, range, token)
      return null
    },
  })
  /*
  languages.registerCodeActionProvider(jsonLanguageId, {
    provideCodeActions: async (model, range, context, token) => {
      console.log('provideCodeActions', model, range, context, token)
      return {
        actions: [
          {
            title: 'test',
            command: {
              id: 'save-file',
              title: 'Save file',
            },
          },
        ],
      }
    },
  })
  */

  setTimeout(() => {

    /*
    languages.setMonarchTokensProvider(jsonLanguageId, {
      tokenizer: {
        root: [
          [/"eval"\s*:\s*"(.*)"/, {
            token: 'source.js',
            nextEmbedded: 'javascript',
            next: '@evalContent',
            log: 'eval detected', // Ajout d'un log pour vérifier
          }],
          [/"[^"]*"/, 'string'],
          [/\b\d+\b/, 'number'],
          [/[{}[\],]/, 'delimiter'],
          [/:/, 'delimiter.colon'],
          [/\s+/, 'white'],
        ],
        evalContent: [
          [/[^"]+/, 'source.js'],
          [/"/, { token: 'string.quote', next: '@pop' }],
        ],
      },
    })
    */
  }, 100)

  watchImmediate(schema, () => {
    // console.log(schema.value.anyOf[0].properties.subdevices.items.properties.items.items.properties.read.anyOf[1].properties.script)
    // anyOf[0].properties.subdevices.items.properties.items.items.properties.parse.anyOf[0].properties.eval
    // "#/anyOf/0/properties/subdevices/items/properties/items/items/properties/read/anyOf/1/properties/script"

    // languages.json.jsonDefaults.setModeConfiguration

    languages.json.jsonDefaults.setDiagnosticsOptions({
      ...languages.json.jsonDefaults.diagnosticsOptions,
      validate: true,
      schemas: [{
        uri: '',
        fileMatch: ['*.json'],
        schema: schema.value,
      }],
    })
  })
}

// #endregion
</script>

<template>
  <v-card class="bundle-editor-v2" v-bind="$attrs">
    <v-layout class="fill-height">
      <v-app-bar
        color="primary"
        prominent
      >
        <v-app-bar-nav-icon variant="text" @click.stop="showLeftMenu = !showLeftMenu" />

        <v-btn v-for="menu in topMenu" :key="menu.title">
          {{ menu.title }}
          <v-menu activator="parent">
            <v-list :items="menu.items" />
          </v-menu>
        </v-btn>
        <v-spacer />
        <v-toolbar-title>{{ bundle?.data.name }}.ddb - Bundler V2</v-toolbar-title>
        <v-spacer />
      </v-app-bar>

      <v-navigation-drawer
        v-model="showLeftMenu"
        class="left-menu"
        :location="$vuetify.display.mobile ? undefined /*'bottom'*/ : undefined"
        permanent
      >
        <v-list
          v-model:selected="selectedLeftMenu"
          density="compact"
          :items="leftMenu"
          select-strategy="single-leaf"
          open-strategy="multiple"
          nav
        >
          <template #prepend="{ item, isActive }">
            <template v-if="!('type' in item)">
              <VIcon
                v-if="item.data?.isDirectory"
                :icon="isActive ? 'mdi-folder-open' : 'mdi-folder'"
              />
              <VIcon
                v-else-if="item.data?.icon"
                :icon="item.data?.icon"
                :color="item.data?.iconColor"
              />
              <VIcon
                v-else
                icon="mdi-file"
                :color="item.data?.iconColor"
              />
            </template>
          </template>
          <template #append="{ item }">
            <template v-if="!('type' in item)">
              <VIcon
                v-if="item.data?.errorCount !== undefined && item.data?.errorCount > 0"
                icon="mdi-alert"
                color="orange"
              />
            </template>
          </template>
        </v-list>
      </v-navigation-drawer>

      <v-main v-show="selectedLeftMenu[0] === 'readme'">
        <v-card class="ma-2">
          <v-card-title>
            {{ bundle.data.desc.product }}
          </v-card-title>
          <v-card-subtitle>
            For deconz {{ bundle.data.desc.version_deconz }}
            • Last modified {{ timeAgo }}
            <br>
            Hash : {{ hash }}
          </v-card-subtitle>
          <v-card-text>
            <v-card class="ma-2">
              <v-card-title>
                Supported devices
              </v-card-title>
              <v-card-text>
                <list-supported-devices :device-identifiers="bundle.data.desc.device_identifiers" />
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>

        <template v-for="file in markdownFiles" :key="file.path">
          <v-card class="ma-2">
            <v-card-title>
              {{ markdownFilesTypes[file.type as keyof typeof markdownFilesTypes] }}
            </v-card-title>
            <v-card-text>
              <vue-markdown :source="file.data as string" />
            </v-card-text>
          </v-card>
        </template>
      </v-main>

      <v-main v-show="isFileSelected" class="d-flex flex-column">
        <v-slide-group
          v-model:model-value="displayedFileIndex"
          center-active
          show-arrows
        >
          <v-slide-group-item
            v-for="file in openedFiles"
            :key="file.sourceFile.path"
          >
            <!-- TODO add the capability to change the order with drag and drop -->
            <v-btn-group
              density="default"
              rounded="0"
            >
              <v-tooltip :text="file.sourceFile.path.replace(/file:\//, '')" open-delay="200">
                <template #activator="{ props: tooltipProps }">
                  <v-btn
                    variant="outlined"
                    v-bind="tooltipProps"
                    :color="file.isDisplayed ? 'primary' : undefined"
                    :prepend-icon="file.icon"
                    :text="file.sourceFile.path.split('/').pop()"
                    :style="file.isPersistent ? '' : 'font-style: italic'"
                    @click="() => openFile(file.sourceFile.path, { isDisplayed: true })"
                  />
                </template>
              </v-tooltip>

              <v-tooltip text="Save file" open-delay="200">
                <template #activator="{ props: tooltipProps }">
                  <v-btn
                    v-show="file.isDirty"
                    v-bind="tooltipProps"
                    variant="outlined"
                    :color="file.isDisplayed ? 'primary' : undefined"
                    icon="mdi-content-save"
                    @click="() => saveFile(file.sourceFile.path)"
                  />
                </template>
              </v-tooltip>

              <v-tooltip text="Close file" open-delay="200">
                <template #activator="{ props: tooltipProps }">
                  <v-btn
                    v-bind="tooltipProps"
                    variant="outlined"
                    :color="file.isDisplayed ? 'primary' : undefined"
                    icon="mdi-close"
                    @click="() => closeFile(file.sourceFile.path)"
                  />
                </template>
              </v-tooltip>
            </v-btn-group>
          </v-slide-group-item>
        </v-slide-group>
        <div class="flex-grow-1">
          <!-- TODO fix editor height on resize -->
          <VueMonacoEditor
            v-model:value="displayedFile.data"
            :path="displayedFile.sourceFile.path"
            theme="vs-dark"
            :language="filesTypes.find((type) => type.type === displayedFile!.sourceFile.type)?.format ?? 'plaintext'"
            @change="fileChanged"
            @mount="handleMonacoEditorMount"
          />
        </div>
      </v-main>
    </v-layout>
  </v-card>
</template>

<style scoped>
.left-menu {
  :deep(.v-list-item__prepend .v-list-item__spacer) {
    width: 4px;
  }
  :deep(.v-list-group__items .v-list-item) {
    padding-inline-start: calc(16px + var(--indent-padding) / 4) !important;
  }
}
</style>
