<script setup lang="ts">
import type { Bundle } from '@deconz-community/ddf-bundler'

const props = defineProps<{
  gateway: string
  hash: string
}>()

const gateway = useGateway(toRef(props, 'gateway'))

const inspectorIsActive = ref(false)
const bundleRef = ref<ReturnType<typeof Bundle> | undefined>()

async function inspect(hash: string) {
  const responses = await gateway.fetch('downloadDDFBundleDecoded', {
    hash,
  })

  responses.forEach((response) => {
    if (response.isOk()) {
      bundleRef.value = response.value
      bundleRef.value.data.name = `${hash}.ddf`
      inspectorIsActive.value = true
    }
    else {
      bundleRef.value = undefined
      inspectorIsActive.value = false
      toast.error('Failed to download bundle')
    }
  })
}
</script>

<template>
  <v-tooltip text="Inspect DDF Bundle">
    <template #activator="{ props: localProps }">
      <v-chip
        v-bind="localProps"
        class="ma-2 text-uppercase"
        color="grey"
        append-icon="mdi-magnify"
        :text="props.hash.slice(0, 10)"
        @click="inspect(props.hash)"
      />
    </template>
  </v-tooltip>

  <v-dialog v-model="inspectorIsActive">
    <template #default>
      <v-card title="Inspect Bundle">
        <v-card-text>
          <bundle-editor
            v-if="bundleRef" v-model="bundleRef" variant="outlined" class="ma-2"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />

          <v-btn
            text="Close Dialog"
            @click="inspectorIsActive = false"
          />
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>
