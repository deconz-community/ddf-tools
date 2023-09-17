<script setup   lang="ts">
import type { BundleFile } from '@deconz-community/ddf-bundler'
import { filePathsToUniqueTree } from '~/lib/filePathsToTree'

const props = defineProps<{
  modelValue: BundleFile[]
}>()

const emit = defineEmits(['update:modelValue', 'change'])

const createConfirm = useConfirm()

const files = useVModel(props, 'modelValue', emit)

const currentPath = ref('')
const breadcrumbs = computed(() => {
  const result = currentPath.value.split('/').filter(Boolean)
  result.unshift('root')
  return result
})

const fileTree = computed(() => filePathsToUniqueTree<BundleFile>(
  files.value.map(file => file.path),
  node => files.value.find(file => file.path === node.path)!,
))

const currentTreePosition = computed(
  () => {
    return breadcrumbs.value.slice(1).reduce(
      (acc, cur) => {
        const next = acc.children.find(child => child.name === cur)
        if (next)
          return next
        currentPath.value = acc.path
        return acc
      },
      fileTree.value,
    )
  },
)

const tableHeaders = [
  {
    title: 'File name',
    align: 'start',
    order: 'asc',
    sortable: true,
    key: 'name',
  },
  {
    title: 'Type',
    align: 'start',
    sortable: true,
    key: 'type',
  },
  {
    title: 'Modified',
    align: 'start',
    sortable: true,
    key: 'last_modified',
  },
  { title: 'Actions', key: 'actions', sortable: false },

] as const

const tableItems = computed(() => {
  const data = []
  for (const file of currentTreePosition.value.children) {
    data.push({
      name: file.name,
      path: file.path,
      type: file.data?.type ?? 'Folder',
      isDirectory: file.children.length > 0,
      last_modified: file.data?.last_modified,
    })
  }
  return data
})

const filesTypes = [
  { type: 'SCJS', desc: 'Javascript file for read, write or parse', format: 'javascript' },
  { type: 'JSON', desc: 'Generic files for items / constants', format: 'json' },
  { type: 'CHLG', desc: 'Changelog', format: 'markdown' },
  { type: 'NOTI', desc: 'Informational note', format: 'markdown' },
  { type: 'NOTW', desc: 'Warning note', format: 'markdown' },
  { type: 'KWIS', desc: 'Know issue', format: 'markdown' },
] as const

const defaultFile: BundleFile = {
  type: 'SCJS',
  path: 'new_file.js',
  last_modified: new Date(),
  data: '',
} as const
const editedItemPath = ref('')
const editedItem = ref<BundleFile>({ ...defaultFile })
const dialog = ref(false)

function newFile() {
  editedItemPath.value = `${currentPath.value === '' ? '' : `${currentPath.value}/`}new_file.js`
  editedItem.value = Object.assign({}, defaultFile)
  dialog.value = true
}

function loadFile(path: string) {
  editedItemPath.value = path
  editedItem.value = Object.assign({}, files.value.find(file => file.path === path))
  dialog.value = true
}

async function deleteFile(path: string) {
  const isConfirmed = await createConfirm({
    content: `Delete file '${path}'`,
  })

  if (!isConfirmed)
    return

  const index = files.value.findIndex(file => file.path === path)
  if (index === -1)
    return
  files.value.splice(index, 1)
  emit('change')
}

function openDirectory(path: string) {
  currentPath.value = path
}

async function deleteDirectory(path: string) {
  const isConfirmed = await createConfirm({
    content: `Delete folder '${path}' and all its content`,
  })

  if (!isConfirmed)
    return

  files.value = files.value.filter(file => !file.path.startsWith(path))
  emit('change')
}

function save() {
  dialog.value = false

  const index = files.value.findIndex(file => file.path === editedItem.value.path)
  if (index === -1)
    files.value.push(editedItem.value)
  else
    files.value[index] = editedItem.value
}

function close() {
  dialog.value = false
  editedItem.value = { ...defaultFile }
  editedItemPath.value = ''
}

function selectDirectory(index: number) {
  if (index <= 0)
    currentPath.value = ''
  else
    currentPath.value = breadcrumbs.value.slice(1, index + 1).join('/')
}
</script>

<template>
  <v-dialog v-model="dialog">
    <v-card>
      <v-card-title>
        <span v-if="editedItemPath" class="text-h5">Editing : {{ editedItemPath }}</span>
        <span v-else class="text-h5">New file</span>
      </v-card-title>

      <v-card-text>
        <v-select
          v-model="editedItem.type"
          :items="filesTypes"
          item-title="desc"
          item-value="type"
          label="Select"
        />

        <v-text-field
          v-model="editedItem.path"
          label="File path"
        />
        <template v-if="typeof editedItem.data === 'string'">
          <VueMonacoEditor
            v-model:value="editedItem.data"
            theme="vs-dark"
            :language="filesTypes.find((type) => type.type === editedItem.type)?.format ?? 'plaintext'"
            height="300px"
          />
        </template>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          color="blue-darken-1"
          variant="text"
          @click="close"
        >
          Cancel
        </v-btn>
        <v-btn
          color="blue-darken-1"
          variant="text"
          @click="save"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-data-table
    :headers="tableHeaders"
    :items="tableItems"
    item-value="name"
    class="elevation-1"
  >
    <!-- eslint-disable vue/valid-v-slot -->
    <template #top>
      <v-toolbar>
        <v-breadcrumbs :items="breadcrumbs" density="comfortable">
          <template #prepend>
            <v-icon size="small" icon="mdi-home" @click="currentPath = ''" />
          </template>
          <template #title="{ item, index }">
            <v-chip @click="selectDirectory(index)">
              {{ item }}
            </v-chip>
          </template>
        </v-breadcrumbs>
        <v-spacer />
        <v-btn
          variant="tonal"
          prepend-icon="mdi-plus"
          @click="newFile()"
        >
          New file
        </v-btn>
      </v-toolbar>
    </template>
    <template #item.name="{ item }">
      <v-icon :icon="item.raw.isDirectory ? 'mdi-folder' : 'mdi-file'" />
      {{ item.columns.name }}
    </template>
    <template #item.last_modified="{ item }">
      <UseTimeAgo v-if="item.columns.last_modified" v-slot="{ timeAgo }" :time="item.columns.last_modified">
        <v-chip>
          {{ timeAgo }}
          <v-tooltip activator="parent" location="top">
            ({{ item.columns.last_modified.toLocaleDateString() }}
            {{ item.columns.last_modified.toLocaleTimeString() }})
          </v-tooltip>
        </v-chip>
      </UseTimeAgo>
    </template>
    <template #item.actions="{ item }">
      <template v-if="item.raw.isDirectory">
        <v-btn class="ma-2" icon="mdi-folder-open" @click="openDirectory(item.raw.path)" />
        <v-btn class="ma-2" icon="mdi-delete" @click="deleteDirectory(item.raw.path)" />
      </template>
      <template v-else>
        <v-btn class="ma-2" icon="mdi-pencil" @click="loadFile(item.raw.path)" />
        <v-btn class="ma-2" icon="mdi-delete" @click="deleteFile(item.raw.path)" />
      </template>
    </template>
  </v-data-table>
  <!--
  <json-viewer :value="fileTree" :expand-level="1" />
  <json-viewer :value="currentTreePosition" :expand-level="1" />
  <json-viewer :value="files" :expand-level="1" />
  -->
</template>
