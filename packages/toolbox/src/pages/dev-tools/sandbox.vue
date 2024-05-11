<script setup lang="ts">
// const store = useStore()
const app = useApp()

function test() {
  toast('sample text')
}
</script>

<template>
  <v-card class="ma-2">
    <template #title>
      Test page
    </template>

    <template #text>
      <!--
      <pre>{{ store.state?.value }}</pre>
      <pre>{{ settings.state }}</pre>
      -->
      <v-btn @click="test()">
        Test
      </v-btn>
    </template>
  </v-card>

  <div class="ma-2">
    <form-gateway-credentials v-if="app.gatewayIds[0]" :gateway="app.gatewayIds[0]" />
  </div>
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": true
  }
}
</route>
