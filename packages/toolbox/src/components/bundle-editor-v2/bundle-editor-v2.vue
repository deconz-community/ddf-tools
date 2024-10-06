<script setup lang="ts">
import type { TextFile } from '@deconz-community/ddf-bundler'
import type { VListItem } from 'vuetify/lib/components/index.mjs'
import { Bundle, generateHash } from '@deconz-community/ddf-bundler'
import { useVModel } from '@vueuse/core'
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
const openedFiles = ref<{ path: string, persistent: boolean }[]>([])

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
        onClick: (event) => {
          const currentTime = new Date().getTime()
          const timeDiff = currentTime - lastClickTime
          // Double click
          if (timeDiff < 300 && timeDiff > 0) {
            event.stopPropagation()
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
  // Prevent empty selection
  if (newValue.length === 0)
    selectedLeftMenu.value = oldValue

  // Remove non-persistent files
  openedFiles.value = openedFiles.value.filter(value => value.persistent)

  // Add new opened file
  if (!openedFiles.value.some(value => value.path === newValue[0])) {
    openedFiles.value.push({ path: newValue[0], persistent: false })
  }
})

const fileTree = computed(() => filePathsToVuetifyList(
  bundle.value.data.files.map(file => file.path),
  node => bundle.value.data.files.find(file => file.path === node.path)!,
))

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
        title: 'New',
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
          onClick: () => { console.log('TODO: download') },
        },
      },
    ],
  },
]

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

        <v-toolbar-title>{{ bundle?.data.name }}.ddb - Bundler V2</v-toolbar-title>

        <!--
        <v-spacer />

        <template v-if="$vuetify.display.mdAndUp">
          <v-btn icon="mdi-magnify" variant="text" />

          <v-btn icon="mdi-filter" variant="text" />
        </template>

        <v-btn icon="mdi-dots-vertical" variant="text" />
        -->
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
        <v-card-text>
          The navigation drawer will appear from the bottom on smaller size screens.
          <hr>
          {{ openedFiles }}
          <hr>
          {{ selectedLeftMenu }}
        </v-card-text>
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
