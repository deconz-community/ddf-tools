<script setup lang="ts">
const store = useStore()
</script>

<template>
  <v-card class="ma-2">
    <template #title>
      Test page
    </template>

    <template #text>
      <pre>{{ store.state?.value }}</pre>
      <!--
      <pre>{{ store.state?.context.profile }}</pre>
      -->
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
