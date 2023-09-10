<script setup lang="ts">
import { json } from '@codemirror/lang-json'

const props = defineProps<{
  modelValue: Record<string, any>
  label: string
  error: boolean
  errorMessages?: Record<string, string>
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

const extensions = [json()]

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
  <codemirror
    v-model="data"
    placeholder="Code goes here..."
    :tab-size="4"
    :extensions="extensions"
    v-bind="attrs"
  />
</template>
