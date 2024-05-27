<script setup lang="ts">
// const store = useStore()
const app = useApp()

const selectedGateway = ref('')
const previewToast = ref('')

function test() {
  toast.info('Event has been created', {
    description: `Some more context of the notification ${Math.random()}`, // subtitle of the snackbar
    progressBar: true,
    loading: true,
    id: 'my-toast',
    // duration: Number.POSITIVE_INFINITY,
  })
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
      {{ previewToast }}
    </template>
  </v-card>

  <div class="ma-2">
    <select-gateway v-model="selectedGateway" required-version=">=1.27.0" multiple />
    {{ selectedGateway }}
  </div>
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": true
  }
}
</route>
