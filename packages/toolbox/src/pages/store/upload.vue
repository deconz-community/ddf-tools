<script setup lang="ts">
import { type Bundle, decode } from "@deconz-community/ddf-bundler";
import type { StoreUploadState } from "@deconz-community/store-api-client";

const error = ref("");
const sha = ref("");
const bundles = ref<ReturnType<typeof Bundle>[]>([]);
const store = useStore();
const files = ref<File[]>([]);
const defaultState = ref<StoreUploadState>("alpha");

watch(files, async () => {
  bundles.value = [];
  files.value.forEach(async (file) => {
    bundles.value.push(markRaw(await decode(file)));
  });
});

async function upload() {
  try {
    if (store.state?.matches({ online: { auth: "connected" } }) !== true)
      throw new Error("You must be logged in to upload a bundle");

    const result = await store.uploadBundles(
      files.value.map((file) => ({ name: file.name, content: file })),
      defaultState.value,
    );
    if (!result) throw new Error("The store API is unavailable.");

    const successes = result.results.filter((item) => item.success);
    const failures = result.results.filter((item) => !item.success);
    if (successes.length > 0) toast.success(`${successes.length} bundles uploaded successfully`);
    for (const failure of failures) {
      toast.error(failure.file, { description: failure.error.message });
    }
  } catch (caught) {
    toast.error("Bundle upload failed", {
      description: caught instanceof Error ? caught.message : String(caught),
    });
  }
}
</script>

<template>
  <v-card class="ma-2">
    <template #title> Upload a DDB file </template>

    <template #text>
      <v-file-input v-model="files" multiple label="Open .ddb bundle from disk" accept=".ddb" />
    </template>
    <template #actions>
      <v-btn variant="tonal" @click="upload()"> Upload </v-btn>
      <v-btn-toggle
        v-if="store.profile?.is_contributor === true"
        v-model="defaultState"
        mandatory
        divided
        variant="outlined"
      >
        <v-btn value="alpha" prepend-icon="mdi-tag-outline" text="Alpha" color="red" :width="100" />
        <v-btn
          value="beta"
          prepend-icon="mdi-tag-outline"
          text="Beta"
          color="orange"
          :width="100"
        />
        <v-btn
          value="stable"
          prepend-icon="mdi-tag-outline"
          text="Stable"
          color="green"
          :width="100"
        />
      </v-btn-toggle>
    </template>
  </v-card>

  <template v-for="(_, index) in bundles" :key="index">
    <bundle-editor v-model="bundles[index]" class="ma-2" />
  </template>
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": true
  }
}
</route>
