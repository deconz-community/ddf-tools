<script setup lang="ts">
import type { Bundle, ValidationError } from '@deconz-community/ddf-bundler'
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

  const ddfcSource = bundle.value.data.files.find(file => file.type === 'DDFC')?.data

  if (!ddfcSource) {
    bundle.value.data.validation = {
      result: 'error',
      version: validator.version,
      errors: [{
        type: 'simple',
        message: 'No DDFC file found.',
      }],
    }

    emit('change')
    return
  }

  const ddfc = JSON.parse(ddfcSource)

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
    // DDF file
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

  const errors: ValidationError[] = []

  validationResult.forEach(({ path, error }) => {
    if (error instanceof ZodError) {
      fromZodError(error).details.forEach((detail) => {
        errors.push({
          type: 'code',
          message: detail.message,
          file: path,
          path: detail.path,
        })
      })
    }
    else {
      errors.push({
        type: 'simple',
        message: error.toString(),
        file: path,
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

    <template v-for="(error, index) in bundle.data.validation?.errors" :key="index">
      <v-card
        v-if="error.type === 'simple'"
        class="ma-2"
        variant="outlined"
        :text="error.message"
      />
      <v-card
        v-if="error.type === 'code'"
        class="ma-2"
        variant="outlined"
        :title="`File : ${error.file}`"
        :text="`${error.message} at ${error.path.join('/')}`"
      />
    </template>
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
