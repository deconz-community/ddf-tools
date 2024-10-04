<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { produce } from 'immer'
import type { Bundle } from '@deconz-community/ddf-bundler'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  modelValue: ReturnType<typeof Bundle>
}>()

const emit = defineEmits(['update:modelValue'])

const bundle = useVModel(props, 'modelValue', emit)

const dirty = ref(false)

const { cloned: files, sync: syncFiles } = useCloned(() => bundle.value.data.files, {
  clone: (data: typeof bundle.value.data.files) => {
    return [...data.map(item => produce(item, () => {}))]
  },
})

watch(bundle, () => {
  syncFiles()
  dirty.value = false
})
</script>

<template>
  <v-card v-bind="$attrs">
    <v-card-text>
      Hello
    </v-card-text>
  </v-card>
</template>
