<script setup lang="ts">
import { Codemirror } from 'vue-codemirror'
import { visit } from 'jsonc-parser'

const data = ref(atob('ewogICAgInNjaGVtYSI6ICJzdWJkZXZpY2UxLnNjaGVtYS5qc29uIiwKICAgICJ0eXBlIjogIiRUWVBFX0NBUkJPTkRJT1hJREVfU0VOU09SIiwKICAgICJuYW1lIjogIlpIQUNhcmJvbkRpb3hpZGUiLAogICAgInJlc3RhcGkiOiAiL3NlbnNvcnMiLAogICAgIm9yZGVyIjogMjAsCiAgICAidXVpZCI6IFsiJGFkZHJlc3MuZXh0IiwgIjB4MDEiLCAiMHgwNDBEIl0sCiAgICAiaXRlbXMiOiBbCiAgICAgICAgImNvbmZpZy9vbiIsCiAgICAgICAgImNvbmZpZy9yZWFjaGFibGUiLAogICAgICAgICJzdGF0ZS9tZWFzdXJlZF92YWx1ZSIsCiAgICAgICAgImNhcC9tZWFzdXJlZF92YWx1ZS9taW4iLAogICAgICAgICJjYXAvbWVhc3VyZWRfdmFsdWUvbWF4IiwKICAgICAgICAiY2FwL21lYXN1cmVkX3ZhbHVlL3VuaXQiLAogICAgICAgICJjYXAvbWVhc3VyZWRfdmFsdWUvZGltZW5zaW9uIiwKICAgICAgICAic3RhdGUvbGFzdHVwZGF0ZWQiCiAgICBdCn0K'))

const paths = ['items/6']

const result = computed(() => {
  visit(data.value, {
    onLiteralValue: (value: any, offset: number, length: number, startLine: number, startCharacter: number, pathSupplier) => {
      const path = pathSupplier().join('/')
      console.log(path)
      console.log({
        startLine: startLine + 1,
        startColumn: startCharacter,
      })
      const index = paths.indexOf(path)
      if (index > -1) {
        paths.splice(index, 1)
        console.log({
          startLine: startLine + 1,
          startColumn: startCharacter,
        })
      }
    },

  })
})
</script>

<template>
  <v-card width="100%" class="ma-2">
    <template #title>
      DDF Bundle
    </template>

    <template #text>
      <Codemirror
        v-model="data"
        placeholder="Code goes here..."
        :autofocus="false"
        :indent-with-tab="false"
        :tab-size="2"
      />
      {{ result }}
    </template>
  </v-card>
</template>

<route lang="json">
{
    "meta": {
        "hideLevelTwoSidebar": true
    }
}
</route>
