<script setup   lang="ts">
import type { BundleFile } from '@deconz-community/ddf-bundler'
import { useConfirm } from 'vuetify-use-dialog'

const props = defineProps<{
  modelValue: BundleFile[]
}>()

const emit = defineEmits(['update:modelValue'])

const createConfirm = useConfirm()

const tableHeaders = [
  {
    title: 'User',
    align: 'start',
    order: 'asc',
    sortable: true,
    key: 'user',
  },

  { title: 'Actions', key: 'actions', sortable: false },

] as const

const tableItems = computed(() => {
  const data = []

  return data
})

function newSignature() {
  console.log('New signature')
}

async function deleteSignature(path: string) {
  const isConfirmed = await createConfirm({
    content: `Delete signature '${path}'`,
  })

  if (!isConfirmed)
    return

  console.log('Delete signature')
}
</script>

<template>
  <v-data-table
    :headers="tableHeaders"
    :items="tableItems"
    item-value="name"
    class="elevation-1"
  >
    <!-- eslint-disable vue/valid-v-slot -->
    <template #top>
      <v-toolbar>
        <v-spacer />
        <v-btn
          variant="tonal"
          prepend-icon="mdi-plus"
          @click="newSignature()"
        >
          New signature
        </v-btn>
      </v-toolbar>
    </template>
    <template #item.name="{ item }">
      <v-icon :icon="item.raw.isDirectory ? 'mdi-folder' : 'mdi-file'" />
      {{ item.columns.name }}
    </template>
    <template #item.actions="{ item }">
      <v-btn class="ma-2" icon="mdi-delete" @click="deleteSignature(item.raw.path)" />
    </template>
  </v-data-table>
</template>
