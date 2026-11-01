<script setup lang="ts">
import type { Bundle } from "@deconz-community/ddf-bundler";
import { encode, generateHash, verifySignature } from "@deconz-community/ddf-bundler";
import { bytesToHex } from "@noble/hashes/utils.js";
import { useVModel } from "@vueuse/core";
import { saveAs } from "file-saver";
import { produce } from "immer";

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<{
  modelValue: ReturnType<typeof Bundle>;
}>();

const emit = defineEmits<{
  "update:modelValue": [bundle: ReturnType<typeof Bundle>];
  status: [status: { dirty: boolean; hasUuid: boolean; invalidSignatures: boolean }];
}>();

const bundle = useVModel(props, "modelValue", emit);

// The bundle is marked raw (not reactive), so the signatures are wrapped to track add/remove
const signatureList = ref(bundle.value.data.signatures);
watch(bundle, (newBundle) => (signatureList.value = newBundle.data.signatures));

const signatures = computed(() =>
  signatureList.value.map((signature) => {
    return {
      key: bytesToHex(signature.key),
    };
  }),
);

const tab = ref<"info" | "files" | "validation" | "signatures">("info");
const dirty = ref(false);

const { cloned: files, sync: syncFiles } = useCloned(() => bundle.value.data.files, {
  clone: (data: typeof bundle.value.data.files) => {
    return [...data.map((item) => produce(item, () => {}))];
  },
});

async function save() {
  bundle.value.data.files = files.value;
  bundle.value.generateDESC();
  bundle.value.data.hash = await generateHash(bundle.value.data);
  dirty.value = false;
}

watch(bundle, () => {
  syncFiles();
  dirty.value = false;
});

const hash = computed(() => {
  return bytesToHex(bundle.value.data.hash ?? new Uint8Array());
});

async function download() {
  saveAs(encode(bundle.value), `${bundle.value.data.name}.ddb`);
}

const timeAgo = useTimeAgo(() => bundle.value.data.desc.last_modified);

function updateUUID(uuid: string) {
  // Commit the pending file edits first so they are kept when the clone is resynced
  bundle.value.data.files = files.value;
  bundle.value.setUUID(uuid);
  syncFiles();
  setDirty();
}

function setDirty() {
  dirty.value = true;
}

async function emitStatus() {
  const { hash, signatures, desc } = bundle.value.data;
  const results = await Promise.all(
    signatures.map((item) =>
      hash ? verifySignature(hash, item.key, item.signature) : Promise.resolve(false),
    ),
  );
  emit("status", {
    dirty: dirty.value,
    hasUuid: !!desc.uuid,
    invalidSignatures: results.some((valid) => !valid),
  });
}

watch([bundle, dirty, signatureList], emitStatus, { immediate: true, deep: true });
</script>

<template>
  <v-card v-bind="$attrs">
    <template #title>
      {{ bundle.data.desc.product }} {{ dirty ? "• Modified" : "" }}
      <chip-signatures :signatures="signatures" class="ma-2" />
    </template>

    <template #subtitle>
      For deconz {{ bundle.data.desc.version_deconz }} • Last modified {{ timeAgo }}
      <br />
      Hash : {{ hash }}
    </template>

    <v-tabs v-model="tab" bg-color="primary">
      <v-tab value="info">
        <v-icon size="x-large" icon="mdi-information" start />
        Info
      </v-tab>
      <v-tab value="files">
        <v-icon size="x-large" icon="mdi-file" start />
        {{ `${files.length} ${files.length > 1 ? "Files" : "File"}` }}
      </v-tab>
      <v-tab value="validation">
        <v-icon size="x-large" icon="mdi-file-code" start />
        Validation
      </v-tab>
      <v-tab value="signatures">
        <v-icon size="x-large" icon="mdi-file" start />
        {{
          `${signatureList.length} ${signatureList.length > 1 ? "Signatures" : "Signature"}`
        }}
      </v-tab>

      <v-spacer />

      <v-btn
        :prepend-icon="dirty ? 'mdi-content-save' : 'mdi-download'"
        color="blue-grey"
        class="ma-1"
        @click="() => (dirty ? save() : download())"
      >
        {{ dirty ? "Save changes" : "Download" }}
      </v-btn>
    </v-tabs>

    <v-card-text>
      <v-window v-model="tab">
        <v-window-item value="info">
          <bundle-editor-info :bundle="bundle" @uuid="updateUUID" />
        </v-window-item>

        <v-window-item value="files">
          <bundle-editor-files v-model="files" @change="setDirty()" />
        </v-window-item>

        <v-window-item value="validation">
          <bundle-editor-validation :bundle="bundle" @change="setDirty()" />
        </v-window-item>

        <v-window-item value="signatures">
          <bundle-editor-signatures
            v-model="signatureList"
            :hash="bundle.data.hash"
            :disabled="dirty"
            @change="emitStatus()"
          />
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>
