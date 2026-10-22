<script setup lang="ts">
import { useConfirm } from "vuetify-use-dialog";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import { utils, getPublicKey } from "@noble/secp256k1";

const createConfirm = useConfirm();

const store = useStore();

const settings = reactive({
  first_name: store.profile?.first_name ?? "",
  avatar_url: store.profile?.avatar_url ?? "",
  private_key: store.profile?.private_key ?? "",
  public_key: store.profile?.public_key ?? "",
});

watch(toRef(store, "profile"), () => {
  settings.first_name = store.profile?.first_name ?? "";
  settings.avatar_url = store.profile?.avatar_url ?? "";
  settings.private_key = store.profile?.private_key ?? "";
  settings.public_key = store.profile?.public_key ?? "";
});

const errorMessage = ref("");

async function generateKeys() {
  if (settings.private_key) {
    const isConfirmed = await createConfirm({
      title: "Generate new keys",
      content: "Any bundles signed with the old keys will no longer be valid.",
    });

    if (!isConfirmed) return;
  }

  settings.private_key = bytesToHex(utils.randomSecretKey());
}

// Update public key when private key changes
watch(toRef(settings, "private_key"), () => {
  try {
    if (!settings.private_key) throw new Error("An error occurred.");

    settings.public_key = bytesToHex(getPublicKey(hexToBytes(settings.private_key)));
    errorMessage.value = "";
  } catch (e) {
    errorMessage.value = "Invalid private key.";
  }
});

async function save() {
  try {
    if (store.profile === undefined) throw new Error("User is not logged in.");

    if (!store.api) throw new Error("Store account service is unavailable.");
    const profile = await store.api.updateProfile({
      first_name: settings.first_name,
      avatar_url: settings.avatar_url || null,
      private_key: settings.private_key || null,
      public_key: settings.public_key || null,
    });
    store.send({ type: "UPDATE_PROFILE", profile });
  } catch (e) {
    console.error(e);
    return toast.error("Error while saving user profile.");
  }

  toast.success("User profile has been saved.");
}
</script>

<template>
  <v-card class="ma-2" title="Account Details">
    <v-card-text>
      <div class="d-flex mb-5">
        <v-avatar size="125" variant="outlined" class="mr-4">
          <v-img
            v-if="store.profile?.avatar_url"
            :src="store.profile?.avatar_url"
            alt="avatar"
            size="125"
          />
          <v-icon v-else icon="mdi-account" size="100" color="grey lighten-1" />
        </v-avatar>
        <v-card class="ma-2 flex-grow-1">
          <v-card-title>
            {{ store.profile?.first_name }}
            <v-chip v-if="store.profile?.is_contributor" class="mx-2">Contributor</v-chip>
          </v-card-title>
          <v-card-subtitle v-if="store.profile?.email">
            {{ store.profile?.email }}
          </v-card-subtitle>
          <v-card-text> Hello </v-card-text>
        </v-card>
      </div>
      <v-text-field :model-value="store.profile?.email" label="Email" readonly />
      <v-text-field v-model="settings.first_name" label="Username" />
      <v-text-field v-model="settings.avatar_url" label="Avatar URL" type="url" />

      <v-divider class="mb-5" />
      <v-text-field
        v-model="settings.private_key"
        label="Signature private key"
        :error-messages="errorMessage"
        append-icon="mdi-reload"
        @click:append="generateKeys"
      />
      <v-text-field v-model="settings.public_key" label="Signature public key" readonly />
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn variant="outlined" @click="save"> Save </v-btn>
    </v-card-actions>
  </v-card>
</template>

<route lang="json">
{
  "meta": {
    "requiresAuth": true,
    "hideLevelTwoSidebar": true
  }
}
</route>
