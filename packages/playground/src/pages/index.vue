<script setup lang="ts">
import { sum } from 'vite-vanilla-ts-lib-starter-core'

const a = ref('1')
const b = ref('2')
const result = computed(() => sum(parseInt(a.value), parseInt(b.value)))
</script>

<template>
  <div class="d-flex align-center flex-column pa-2">
    <v-card width="100%" class="ma-2">
      <template #title>
        Sum function
      </template>

      <template #text>
        <v-container>
          <v-text-field
            v-model="a"
            label="Number A"
            type="number"
            required
          />
          <v-text-field
            v-model="b"
            label="Number B"
            type="number"
            required
          />
          <v-text-field
            v-model="result"
            label="Result"
            type="number"
            readonly
          />
        </v-container>
      </template>
    </v-card>
  </div>
</template>
