<script setup lang="ts">
const props = defineProps<{
  gateway: string
}>()

const gateway = useGateway(toRef(props, 'gateway'))

const baseUrl = gateway.select(state => state.context.gateway?.address)

const downloadUrl = computed(() => {
  if (!baseUrl.value)
    return

  return typeof baseUrl.value === 'function'
    ? `${baseUrl.value()}/deCONZ.tar.gz`
    : `${baseUrl.value}/deCONZ.tar.gz`
})
</script>

<template>
  <v-btn
    append-icon="mdi-download"
    size="large"
    variant="elevated"
    :disabled="!downloadUrl"
    :href="downloadUrl"
  >
    Download backup
  </v-btn>
</template>
