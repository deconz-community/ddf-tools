<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits(['update:modelValue', 'change'])

const ddfc = useVModel(props, 'modelValue', emit)
</script>

<template>
  <VueMonacoEditor
    v-model:value="ddfc"
    theme="vs-dark"
    language="json"
    height="500px"
    :options="{
      automaticLayout: true,
    }"
    @change="emit('change')"
  />
</template>
