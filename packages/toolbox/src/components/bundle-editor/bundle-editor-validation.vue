<script setup lang="ts">
import type { Bundle } from '@deconz-community/ddf-bundler'
import { createValidator } from '@deconz-community/ddf-validator'
import { ZodError } from 'zod'
import { fromZodError } from 'zod-validation-error'

const props = defineProps<{
  bundle: ReturnType<typeof Bundle>
}>()

const emit = defineEmits(['update:modelValue', 'change'])

const bundle = useVModel(props, 'bundle', emit)

function validate() {
  const validator = createValidator()

  const ddfc = JSON.parse(bundle.value.data.ddfc)

  if (ddfc.ddfvalidate === false) {
    bundle.value.data.validation = {
      result: 'skipped',
      version: validator.version,
    }

    emit('change')
    return
  }

  const validationResult = validator.bulkValidate(
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
        data: ddfc,
      },
    ],
  )

  if (validationResult.length === 0) {
    bundle.value.data.validation = {
      result: 'success',
      version: validator.version,
    }

    emit('change')
    return
  }

  const errors: {
    message: string
    path: (string | number)[]
  }[] = []

  validationResult.forEach(({ path, error }) => {
    if (error instanceof ZodError) {
      fromZodError(error).details.forEach((detail) => {
        errors.push({
          path: [path, ...detail.path],
          message: detail.message,
        })
      })
    }
    else {
      errors.push({
        path: [path],
        message: error.toString(),
      })
    }
  })

  bundle.value.data.validation = {
    result: 'error',
    version: validator.version,
    errors,
  }

  emit('change')
}
</script>

<template>
  <v-btn class="ma-2" variant="tonal" @click="validate()">
    Validate
  </v-btn>

  <v-alert
    v-if="bundle.data.validation?.result === 'success'"
    class="ma-2"
    type="success"
    title="Validation result"
    text="This bundle passed the validation."
  />

  <template v-else-if="bundle.data.validation?.result === 'error'">
    <v-alert
      class="ma-2"
      type="error"
      title="Validation result"
      :text="`${bundle.data.validation?.errors.length} errors found.`"
    />

    <v-card
      v-for="(error, index) in bundle.data.validation?.errors" :key="index"
      class="ma-2"
      variant="outlined"
      :title="`File : ${error.path[0]}`"
      :text="`${error.message} at ${error.path.slice(1).join(' ')}`"
    />
  </template>

  <v-alert
    v-else-if="bundle.data.validation?.result === 'skipped'"
    class="ma-2"
    type="warning"
    title="Validation result"
    text="This bundle was skipped from validation."
  />

  <v-alert
    v-else
    class="ma-2"
    type="info"
    title="Validation result"
    text="No validation has been run yet."
  />
</template>
