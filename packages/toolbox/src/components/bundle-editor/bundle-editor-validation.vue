<script setup lang="ts">
import type { Bundle } from '@deconz-community/ddf-bundler'
import { createValidator } from '@deconz-community/ddf-validator'

const props = defineProps<{
  bundle: ReturnType<typeof Bundle>
}>()

const bundle = useVModel(props, 'bundle')

function validate() {
  const validator = createValidator()

  console.log(bundle.value.data.files)
}
</script>

<template>
  <v-text-field
    v-model="bundle.data.desc.uuid"
    readonly
    label="UUID"
  />

  <v-btn @click="validate()">
    Validate
  </v-btn>
</template>
