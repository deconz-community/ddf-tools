<script setup lang="ts">
import type { Bundle } from '@deconz-community/ddf-bundler'
import { createValidator } from '@deconz-community/ddf-validator'
import { fromZodError } from 'zod-validation-error'

const props = defineProps<{
  bundle: ReturnType<typeof Bundle>
}>()

const emit = defineEmits(['update:modelValue', 'change'])

const bundle = useVModel(props, 'bundle', emit)

const errors = ref<{ path: string, message: string }[]>([])

function validate() {
  try {
    errors.value = createValidator().bulkValidate(
      // Generic files
      bundle.value.data.files
        .filter(file => file.type === 'JSON')
        .map((file) => {
          return {
            path: file.path,
            data: JSON.parse(file.data as string),
          }
        }),
      [
        {
          path: bundle.value.data.name,
          data: JSON.parse(bundle.value.data.ddfc),
        },
      ],
    ).map(({ error, path }) => {
      let message = ''
      try {
        message = fromZodError(error, {
          issueSeparator: '\n    ',
          prefix: null,
        }).message
      }
      catch (e) {
        message = error.toString()
      }
      return {
        path,
        message,
      }
    })
  }
  catch (e) {
    console.error(e)
  }
}
</script>

<template>
  <v-btn color="success" @click="validate()">
    Validate
  </v-btn>

  <v-card v-for="(error, index) in errors" :key="index">
    <v-card-title>{{ error.path }}</v-card-title>
    <v-card-text>
      <pre>{{ error.message }}</pre>
    </v-card-text>
  </v-card>
</template>
