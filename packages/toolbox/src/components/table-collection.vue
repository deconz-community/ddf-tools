<script setup lang="ts">
const props = withDefaults(defineProps<{
  collection: string
  filter?: string
}>(), {
  filter: '',
})

const emits = defineEmits<{
  (e: 'updateTotalCount', value: number): void
}>()

defineSlots<{
  default: { item: any }
}>()

const { client } = useStore()

const itemsPerPage = ref(1)
const totalItems = ref(0)
watch(totalItems, (value) => {
  emits('updateTotalCount', value)
})
const loading = ref(false)

const headers = [
  {
    title: 'ID',
    align: 'start',
    sortable: true,
    key: 'id',
  },
  {
    title: 'Name',
    align: 'start',
    sortable: true,
    key: 'name',
  },
  {
    title: 'Description',
    align: 'start',
    sortable: false,
    key: 'description',
  },
] as const

const serverItems = ref<any[]>([])

async function loadItems(options) {
  console.log(options)
  loading.value = true
  const result = await client.collection(props.collection)
    .getList(options.page, options.itemsPerPage, { filter: props.filter })
  serverItems.value = result.items
  totalItems.value = result.totalItems
  loading.value = false
}

const list = ['name', 'description']
</script>

<template>
  <v-data-table-server
    v-model:items-per-page="itemsPerPage"
    :headers="headers"
    :items-length="totalItems"
    :items="serverItems"
    :loading="loading"
    :items-per-page-options="[
      { value: 1, title: '1' },
      { value: 10, title: '10' },
      { value: 20, title: '20' },
      { value: 30, title: '30' },
    ]"
    class="elevation-1"
    item-value="name"
    @update:options="loadItems"
  >
    <template #item.name="{ item }">
      Foo {{ item.columns.name }}
    </template>
  </v-data-table-server>
</template>

<style scoped>

</style>
