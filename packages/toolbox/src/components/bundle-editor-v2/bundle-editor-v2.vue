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

// #region Actions

async function createNew() {
  const newBundle = Bundle()
  newBundle.data.hash = await generateHash(newBundle.data)
  bundle.value = newBundle
}

// #endregion

// #region Left Menu
const showLeftMenu = ref(true)
const selectedLeftMenu = ref(['info'])
const openedFiles = ref<{
  path: string
  icon: VListItem['$props']['prependIcon']
  persistent: boolean
}[]>([])

const openedFileIndex = computed(() => {
  return openedFiles.value.findIndex(candidate => candidate.path === selectedLeftMenu.value[0])
})

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
    let prependIcon = 'mdi-folder'

    if (node.data) {
      switch (node.data.type) {
        case 'JSON':
        case 'DDFC':
          prependIcon = 'mdi-code-json'
          break
        case 'SCJS':
          prependIcon = 'mdi-language-javascript'
          break
        case 'CHLG':
        case 'INFO':
        case 'KWIS':
        case 'WARN':
          prependIcon = 'mdi-language-markdown'
          break
        default:
          prependIcon = 'mdi-file'
      }
    }

    const value = prependIcon === 'mdi-folder' ? `folder://${node.path}` : `file://${node.path}`

    let lastClickTime = 0

    return {
      title: node.name,
      value,
      props: {
        prependIcon,
        onClick: () => {
          const currentTime = new Date().getTime()
          const timeDiff = currentTime - lastClickTime
          // Double click
          if (timeDiff < 500 && timeDiff > 0) {
            const openedFile = openedFiles.value.find(candidate => candidate.path === value)
            if (openedFile) {
              openedFile.persistent = true
            }
          }

          lastClickTime = currentTime
        },
      },
      children: node.children.length > 0 ? node.children.map(convertLeaf) : undefined,
    }
  }

  return filePathsToTree<TextFile>(paths, getData).map(convertLeaf)
}

watch(selectedLeftMenu, (newValue, oldValue) => {
  // Remove non-persistent files
  openedFiles.value = openedFiles.value.filter(value => value.persistent)

  if (newValue.length === 0) {
    if (openedFiles.value.find(value => value.path === oldValue[0])) {
      selectedLeftMenu.value = oldValue
      return
    }

    const nextFile = openedFiles.value[0]?.path
    if (nextFile)
      selectedLeftMenu.value = [nextFile]
    else
      selectedLeftMenu.value = ['info']

    return
  }

  const filePath = newValue[0]

  if (!filePath)
    return

  // Add new opened file
  if (filePath.startsWith('file://') && !openedFiles.value.some(value => value.path === filePath)) {
    openedFiles.value.push({
      path: filePath,
      icon: fileTree.value.find(candidate => candidate.value === filePath)?.props.prependIcon,
      persistent: false,
    })
  }
})

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
const defaultFile: BundleFile = {
  type: 'SCJS',
  path: 'new_file.js',
  last_modified: new Date(),
  data: '',
} as const
const editedFile = ref<BundleFile>({ ...defaultFile })

const editedFilePath = computed<string | undefined>(() => {
  const filePath = selectedLeftMenu.value[0]
  if (!filePath || !filePath.startsWith('file://'))
    return undefined

  return filePath.replace('file://', '')
})

watch(editedFilePath, (newFilePath) => {
  if (newFilePath === undefined)
    return

  const file = bundle.value.data.files.find(candidate => candidate.path === newFilePath)

  if (file === undefined)
    return

  editedFile.value = file
})

// #endregion

selectedLeftMenu.value = ['file://starkvind_air_purifier.json']
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

      <v-main>
        <v-slide-group
          v-model:model-value="openedFileIndex"
          center-active
          class="mb-2"
          show-arrows
        >
          <v-slide-group-item
            v-for="file in openedFiles"
            :key="file.path"
            v-slot="{ isSelected }"
          >
            <!-- TODO add the capability to change the order with drag and drop -->
            <v-btn-group
              density="default"
              rounded="0"
            >
              <v-tooltip :text="file.path.replace(/file:\//, '')" open-delay="200">
                <template #activator="{ props: tooltipProps }">
                  <v-btn
                    variant="outlined"
                    v-bind="tooltipProps"
                    :color="isSelected ? 'primary' : undefined"
                    :prepend-icon="file.icon"
                    :text="file.path.split('/').pop()"
                    :style="file.persistent ? '' : 'font-style: italic'"
                    @click="() => selectedLeftMenu = [file.path]"
                  />
                </template>
              </v-tooltip>

              <v-tooltip :text="`Close ${file.path.startsWith('file://') ? 'file' : 'tab'}`" open-delay="200">
                <template #activator="{ props: tooltipProps }">
                  <v-btn
                    v-bind="tooltipProps"
                    variant="outlined"
                    :color="isSelected ? 'primary' : undefined"
                    icon="mdi-close"
                    @click="() => { openedFiles = openedFiles.filter(candidate => candidate.path !== file.path); selectedLeftMenu = [] }"
                  />
                </template>
              </v-tooltip>
            </v-btn-group>
          </v-slide-group-item>
        </v-slide-group>

        Insert content here

        {{ selectedLeftMenu }}

        {{ editedFile }}
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
