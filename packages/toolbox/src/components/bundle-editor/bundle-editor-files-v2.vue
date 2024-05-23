<script setup   lang="ts">
import type { BundleFile } from '@deconz-community/ddf-bundler'
import { filePathsToTree } from '~/lib/filePathsToTree'

const props = defineProps<{
  modelValue: BundleFile[]
}>()

const emit = defineEmits(['update:modelValue', 'change'])

const createConfirm = useConfirm()

// const files = useVModel(props, 'modelValue', emit)

const files = useVModel(props, 'modelValue', emit)

const fileTree = computed(() => filePathsToTree<BundleFile>(
  files.value.map(file => file.path),
  node => files.value.find(file => file.path === node.path)!,
))

const filesIcons = {
  JSON: 'mdi-code-json',
  DDFC: 'mdi-code-json',
  SCJS: 'mdi-language-javascript',
  CHLG: 'mdi-language-markdown',
  NOTI: 'mdi-language-markdown',
  NOTW: 'mdi-language-markdown',
  KWIS: 'mdi-language-markdown',
} as const

const activated = ref([fileTree.value.find(item => item.data?.type === 'DDFC')?.path])
</script>

<template>
   <v-toolbar density="compact">
      <v-app-bar-nav-icon></v-app-bar-nav-icon>

      <v-toolbar-title>Title</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn icon>
        <v-icon>mdi-magnify</v-icon>
      </v-btn>

      <v-btn icon>
        <v-icon>mdi-heart</v-icon>
      </v-btn>

      <v-btn icon>
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn>
    </v-toolbar>
  <v-treeview
    v-model:activated="activated"
    activatable
    :items="fileTree"
    item-title="name"
    item-value="path"
    :item-children="item => item.children.length > 0 ? item.children : null"
    expand-icon=""
    collapse-icon=""
    active-strategy="single-leaf"
    open-on-click
  >
    <template #prepend="{ item, isActive }">
      <v-icon v-if="item.children.length > 0">
        {{ isActive ? 'mdi-folder-open' : 'mdi-folder' }}
      </v-icon>
      <v-icon v-else-if="item.data?.type && filesIcons[item.data.type]">
        {{ filesIcons[item.data.type] }}
      </v-icon>
      <v-icon v-else>
        mdi-file
      </v-icon>
    </template>
  </v-treeview>
  {{ activated }}
</template>
