<script setup lang="ts">
import type { ActorRefFrom } from 'xstate'

const app = useApp()

console.log(app)

function test() {
  const list: string[] = []

  const machineTree = (machine: ActorRefFrom<any>, currentPath = '') => {
    for (const child of machine.children.entries()) {
      list.push(currentPath + child[0])
      machineTree(child[1], `${currentPath + child[0]}.`)
    }
  }

  machineTree(app.machine, 'app.')

  console.log(list)
}
</script>

<template>
  Discovery
  <v-btn @click="test()">
    Test
  </v-btn>
</template>

<route lang="json">
{
  "meta": {
    "breadcrumbs": "none",
    "hideLevelTwoSidebar": true
  }
}
</route>
