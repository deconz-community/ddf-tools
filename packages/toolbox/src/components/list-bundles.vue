<script setup lang="ts">
const props = withDefaults(defineProps<{
  filter?: string
}>(), {
  filter: '',
})

const emits = defineEmits<{
  (e: 'updateTotalCount', value: number): void
}>()

const store = useStore()

const page = ref(1)
const itemsPerPage = ref(1)
const totalItems = ref(0)
watch(totalItems, (value) => {
  emits('updateTotalCount', value)
})
const loading = ref(false)

const serverItems = ref<any[]>([])
async function loadItems(options: { page: number; itemsPerPage: number }) {
  // console.log(options)

  loading.value = true
  const result = await store.client?.collection('bundle')
    .getList(options.page, options.itemsPerPage, {
      filter: props.filter && '',
      expand: 'contributors',
    })

  serverItems.value = result?.items ?? []
  totalItems.value = result?.totalItems ?? 0
  loading.value = false
}
</script>

<template>
  <v-data-iterator
    :items="serverItems"
    :page="page"
    @update:options="loadItems"
  >
    <template #default="{ items }">
      <template
        v-for="(item, i) in items"
        :key="i"
      >
        <v-card>
          <v-card-title>{{ item.raw.name }}</v-card-title>
          <v-card-subtitle>{{ item.raw.description }}</v-card-subtitle>
        </v-card>
        <pre>{{ item.raw }}</pre>

        <br>
      </template>
    </template>
  </v-data-iterator>

  <!--
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
      Bar {{ item.columns.name }}
    </template>
  </v-data-table-server>
  -->
</template>

<style scoped>

</style>
