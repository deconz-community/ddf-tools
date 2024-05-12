<script setup lang="ts">
import VueMonacoEditor from '@guolao/vue-monaco-editor'

const props = defineProps<{
  modelValue: Record<string, any>
  error: boolean
  errorMessages?: Record<string, string>
  height?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void
}>()

const localErrorMessages = ref('')

const errorMessages = computed(() => {
  // Merge all error messages into a single string with the key and the message.
  return localErrorMessages.value
    + Object.entries(props.errorMessages ?? {})
      .map(([key, message]) => `${key[0].toUpperCase() + key.slice(1)}: ${message}.`)
      .join('\n')
})

const attrs = useAttrs()

const data = computed({
  // getter
  get() {
    return JSON.stringify(
      props.modelValue,
      (_k, v) => v === undefined ? null : v,
      4,
    )
  },
  // setter
  set(newValue) {
    localErrorMessages.value = ''
    // Note: we are using destructuring assignment syntax here.
    try {
      emit('update:modelValue', JSON.parse(
        newValue,
        (_k, v) => v === null ? undefined : v,
      ))
    }
    catch (e) {
      if (e instanceof Error)
        localErrorMessages.value = e.message
      else if (typeof e === 'string')
        localErrorMessages.value = e
    }
  },
})
</script>

<template>
  <v-alert
    v-if="errorMessages"
    color="error"
    icon="$error"
    variant="tonal"
    :text="errorMessages"
  />
  <VueMonacoEditor
    v-model:value="data"
    theme="vs-dark"
    language="json"
    :options="{
      minimap: {
        enabled: false,
      },
      scrollbar: {
        vertical: 'hidden',
        horizontal: 'hidden',
      },
      lineNumbers: 'on',
      wordWrap: 'on',
    }"

    v-bind="attrs"
    :height="props.height ?? '200px'"
  />
</template>
