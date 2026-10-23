<script setup lang="ts">
import { useConfirm } from "vuetify-use-dialog";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import { utils, getPublicKey } from "@noble/secp256k1";
import { createTokenManager } from "~/lib/store-tokens";

const createConfirm = useConfirm();

const store = useStore();

const settings = reactive({
  username: store.profile?.username ?? "",
  avatar_url: store.profile?.avatar_url ?? "",
  private_key: store.profile?.private_key ?? "",
  public_key: store.profile?.public_key ?? "",
});

watch(toRef(store, "profile"), () => {
  settings.username = store.profile?.username ?? "";
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

const tokenName = ref("");
const tokenManager = computed(() => (store.api ? createTokenManager(store.api) : undefined));

watch(
  tokenManager,
  (manager) => {
    manager?.refresh();
  },
  { immediate: true },
);

async function createToken() {
  await tokenManager.value?.create(tokenName.value);
  if (!tokenManager.value?.state.error) tokenName.value = "";
}

async function copySecret(secret: string) {
  await navigator.clipboard.writeText(secret);
  toast.success("Token copied.");
}

async function save() {
  try {
    if (store.profile === undefined) throw new Error("User is not logged in.");

    if (!store.api) throw new Error("Store account service is unavailable.");
    const profile = await store.api.updateProfile({
      username: settings.username,
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
            {{ store.profile?.username }}
            <v-chip v-if="store.profile?.is_contributor" class="mx-2">Contributor</v-chip>
          </v-card-title>
          <v-card-subtitle v-if="store.profile?.email">
            {{ store.profile?.email }}
          </v-card-subtitle>
          <v-card-text> Hello </v-card-text>
        </v-card>
      </div>
      <v-text-field :model-value="store.profile?.email" label="Email" readonly />
      <v-text-field v-model="settings.username" label="Username" />
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

  <v-card v-if="tokenManager" class="ma-2" title="API tokens">
    <v-card-text>
      <p class="mb-4">Use API tokens to authenticate the CLI without your password.</p>
      <v-alert
        v-if="tokenManager.state.revealedSecret"
        type="warning"
        class="mb-4"
        closable
        @click:close="tokenManager.dismissSecret()"
      >
        <div>
          Copy the token "{{ tokenManager.state.revealedSecret.name }}" now. It will not be shown
          again.
        </div>
        <code class="d-block my-2" data-testid="token-secret">
          {{ tokenManager.state.revealedSecret.secret }}
        </code>
        <v-btn
          size="small"
          variant="outlined"
          @click="copySecret(tokenManager.state.revealedSecret.secret)"
        >
          Copy
        </v-btn>
      </v-alert>
      <v-alert v-if="tokenManager.state.error" type="error" class="mb-4">
        {{ tokenManager.state.error }}
      </v-alert>
      <div class="d-flex align-center">
        <v-text-field
          v-model="tokenName"
          label="Token name"
          maxlength="100"
          hide-details
          class="mr-2"
          @keyup.enter="createToken"
        />
        <v-btn variant="outlined" @click="createToken"> Create token </v-btn>
      </div>
      <v-list>
        <v-list-item
          v-for="token in tokenManager.state.tokens"
          :key="token.id"
          :title="token.name"
          :subtitle="`${token.prefix}… · created ${token.date_created} · ${
            token.last_used ? `last used ${token.last_used}` : 'never used'
          }`"
        >
          <template #append>
            <v-chip v-if="token.revoked" size="small">Revoked</v-chip>
            <v-btn v-else variant="text" color="error" @click="tokenManager.revoke(token.id)">
              Revoke
            </v-btn>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
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
