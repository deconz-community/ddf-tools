<script setup lang="ts">
import type { BundleFile, TextFile } from '@deconz-community/ddf-bundler'
import type { VListItem } from 'vuetify/lib/components/index.mjs'
import { Bundle, encode, generateHash } from '@deconz-community/ddf-bundler'
import { useVModel } from '@vueuse/core'
import { saveAs } from 'file-saver'
import type { Node } from '~/lib/filePathsToTree'
import { filePathsToTree } from '~/lib/filePathsToTree'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  modelValue: ReturnType<typeof Bundle>
}>()

const emit = defineEmits(['update:modelValue'])

const bundle = useVModel(props, 'modelValue', emit)

// #region Constants

const defaultFile: BundleFile = {
  type: 'SCJS',
  path: 'new_file.js',
  last_modified: new Date(),
  data: '',
} as const

const filesTypes = [
  { type: 'DDFC', icon: 'mdi-code-json', desc: 'JSON DDF File', format: 'json' },
  { type: 'SCJS', icon: 'mdi-language-javascript', desc: 'Javascript file for read, write or parse', format: 'javascript' },
  { type: 'JSON', icon: 'mdi-code-json', desc: 'Generic files for items / constants', format: 'json' },
  { type: 'CHLG', icon: 'mdi-language-markdown', desc: 'Changelog', format: 'markdown' },
  { type: 'INFO', icon: 'mdi-language-markdown', desc: 'Informational note', format: 'markdown' },
  { type: 'WARN', icon: 'mdi-language-markdown', desc: 'Warning note', format: 'markdown' },
  { type: 'KWIS', icon: 'mdi-language-markdown', desc: 'Know issue', format: 'markdown' },
] as const

// #endregion

// #region File editor

interface EditedFile {
  sourceFile: BundleFile
  data: string
  icon: VListItem['$props']['prependIcon']
  isPersistent: boolean
  // isDirty?: boolean
  isDisplayed: boolean
  // TODO save scroll position
  // TODO add undo monaco history save state
}

const openedFiles = ref<EditedFile[]>([])
// Any displayed file need to be in the openedFiles array
const displayedFile = ref<EditedFile | undefined>()
const displayedFileIndex = ref(0)

watch(displayedFile, (newDisplayedFile, oldDisplayedFile) => {
  if (oldDisplayedFile) {
    oldDisplayedFile.isDisplayed = false
  }

  openedFiles.value = openedFiles.value.filter(file => file.isPersistent)

  if (newDisplayedFile) {
    displayedFileIndex.value = openedFiles.value.findIndex(file => file === newDisplayedFile)
    newDisplayedFile.isDisplayed = true
  }
})

// #endregion

// #region Left Menu
const showLeftMenu = ref(true)
const selectedLeftMenu = ref(['info'])
const isFileSelected = computed(() => selectedLeftMenu.value[0]?.startsWith('file://'))

const fileTree = computed(() => filePathsToVuetifyList(
  bundle.value.data.files.map(file => file.path),
  node => bundle.value.data.files.find(file => file.path === node.path)!,
))

function filePathsToVuetifyList(paths: string[], getData?: (node: Node<TextFile>) => TextFile) {
  interface ListItem {
    title: string
    value: string
    props: VListItem['$props']
    children: ListItem[] | undefined
  }

  function convertLeaf(node: Node<TextFile>): ListItem {
    // TODO not really pretty code
    let prependIcon = 'mdi-folder'

    if (node.data) {
      const fileType = filesTypes.find(type => type.type === node.data!.type)
      prependIcon = fileType?.icon ?? 'mdi-file'
    }

    const path = prependIcon === 'mdi-folder' ? `folder://${node.path}` : `file://${node.path}`

    let lastClickTime = 0

    return {
      title: node.name,
      value: path,
      props: {
        prependIcon,
        onClick: () => {
          const currentTime = new Date().getTime()
          const timeDiff = currentTime - lastClickTime
          const isDoubleClick = timeDiff < 500 && timeDiff > 0
          openFile(path, { persistent: isDoubleClick })
          lastClickTime = currentTime
        },
      },
      children: node.children.length > 0 ? node.children.map(convertLeaf) : undefined,
    }
  }

  return filePathsToTree<TextFile>(paths, getData).map(convertLeaf)
}

const leftMenu = computed(() => {
  const menu: Record<string, any>[] = [
    {
      title: 'Info',
      value: 'info',
    },
  ]

  menu.push({ type: 'divider' })
  menu.push({ type: 'subheader', title: `${bundle.value.data.name}.ddb` })
  menu.push(...fileTree.value)
  menu.push({ type: 'divider' })

  return menu
})

// #endregion

// #region Top Menu

const topMenu = [
  {
    title: 'File',
    items: [
      {
        title: 'New bundle',
        props: {
          prependIcon: 'mdi-file',
          onClick: () => createNew(),
        },
      },
      {
        title: 'Open',
        props: {
          prependIcon: 'mdi-folder-open',
          onClick: () => { console.log('TODO: Open') },
        },
      },
      {
        title: 'Save',
        props: {
          prependIcon: 'mdi-content-save',
          onClick: () => { console.log('TODO: Save') },
        },
      },
      {
        title: 'Save as',
        props: {
          prependIcon: 'mdi-content-save-settings',
          onClick: () => { console.log('TODO: Save as') },
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
]

// #endregion

// #region File editor

// #endregion

// #region Actions
async function createNew() {
  const newBundle = Bundle()
  newBundle.data.hash = await generateHash(newBundle.data)
  bundle.value = newBundle
}

function openFile(path: string, { persistent: isPersistent = false, isDisplayed = true } = {}) {
  if (path.startsWith('file://')) {
    path = path.replace('file://', '')
  }

  const alreadyOpenedFile = openedFiles.value.find(candidate => candidate.sourceFile.path === path)

  if (alreadyOpenedFile) {
    alreadyOpenedFile.isPersistent = alreadyOpenedFile.isPersistent || isPersistent

    if (isDisplayed && displayedFile.value !== alreadyOpenedFile) {
      displayedFile.value = alreadyOpenedFile
    }
  }
  else {
    const sourceFile = bundle.value.data.files.find(candidate => candidate.path === path)

    if (!sourceFile) {
      console.error(`File not found: ${path}`)
      return
    }

    const openingFile: EditedFile = {
      sourceFile,
      data: sourceFile.data,
      icon: fileTree.value.find(candidate => candidate.value === path)?.props.prependIcon,
      isPersistent,
      isDisplayed: false, // Will be updated lated by the displayedFile watcher
    }

    openedFiles.value.push(openingFile)
    triggerRef(openedFiles) // TODO nedded ?

    if (isDisplayed) {
      displayedFile.value = openingFile
    }
  }
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

  if (closingIndex > 0 && openedFiles.value[closingIndex].isDisplayed) {
    displayedFile.value = openedFiles.value[closingIndex - 1]
  }

  openedFiles.value.splice(closingIndex, 1)
}

// #endregion

nextTick(() => {
  openFile('file://starkvind_air_purifier.json', { persistent: true })
})
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

        <div class="d-flex">
          <v-spacer class="flex-shrink-1" />
          <v-toolbar-title>{{ bundle?.data.name }}.ddb - Bundler V2</v-toolbar-title>
          <v-spacer class="flex-shrink-1" />
        </div>
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
        >
          <template #prepend="{ item, isActive }">
            <template v-if="item.props?.prependIcon === 'mdi-folder'">
              <v-icon v-if="isActive" icon="mdi-chevron-down" />
              <v-icon v-else icon="mdi-chevron-right" />
            </template>
            <v-icon v-else-if="item.props?.prependIcon" :icon="item.props.prependIcon" />
          </template>
          <template #append />
        </v-list>
      </v-navigation-drawer>

      <v-main v-show="isFileSelected" class="d-flex flex-column">
        <v-slide-group
          v-model:model-value="displayedFileIndex"
          center-active
          show-arrows
        >
          <v-slide-group-item
            v-for="file in openedFiles"
            :key="file.sourceFile.path"
            v-slot="{ isSelected }"
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
                    :color="isSelected ? 'primary' : undefined"
                    :prepend-icon="file.icon"
                    :text="file.sourceFile.path.split('/').pop()"
                    :style="file.isPersistent ? '' : 'font-style: italic'"
                    @click="() => openFile(file.sourceFile.path, { isDisplayed: true })"
                  />
                </template>
              </v-tooltip>

              <v-tooltip :text="`Close ${file.sourceFile.path.startsWith('file://') ? 'file' : 'tab'}`" open-delay="200">
                <template #activator="{ props: tooltipProps }">
                  <v-btn
                    v-bind="tooltipProps"
                    variant="outlined"
                    :color="isSelected ? 'primary' : undefined"
                    icon="mdi-close"
                    @click="() => closeFile(file.sourceFile.path)"
                  />
                </template>
              </v-tooltip>
            </v-btn-group>
          </v-slide-group-item>
        </v-slide-group>
        <div class="flex-grow-1">
          <template v-if="displayedFile">
            <VueMonacoEditor
              v-model:value="displayedFile.data"
              theme="vs-dark"
              :language="filesTypes.find((type) => type.type === displayedFile!.sourceFile.type)?.format ?? 'plaintext'"
            />
          </template>
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
