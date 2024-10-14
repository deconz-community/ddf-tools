<script setup lang="ts">
export type Language = 'json' | 'javascript' | 'markdown' | 'plaintext'
const props = withDefaults(defineProps<{
  modelValue: string
  title: string
  language: Language
  height?: string
}>(), {
  height: '400px',
})

const emit = defineEmits(['update:modelValue', 'change'])

const data = useVModel(props, 'modelValue', emit)

const fileInput = ref<File>()

watch(fileInput, (file) => {
  if (!file)
    return
  file.text().then(text => data.value = text)
})

watch(data, (value) => {
  if (value.length === 0) {
    fileInput.value = undefined
  }
  emit('change')
})
</script>

<template>
  <v-card>
    <v-card-title>
      <v-file-input
        v-model="fileInput"
        accept=".json, .txt, .js, .md"
        :label="props.title"
        hide-details
      />
    </v-card-title>
    <v-card-text>
      <VueMonacoEditor
        v-model:value="data"
        theme="vs-dark"
        :language="props.language"
        :height="props.height"
        @change="emit('change')"
      />
    </v-card-text>
  </v-card>
</template>
