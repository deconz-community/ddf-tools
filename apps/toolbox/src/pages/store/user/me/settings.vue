<script setup lang="ts">
import { useConfirm } from "vuetify-use-dialog";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import { utils, getPublicKey } from "@noble/secp256k1";
import { createTokenManager } from "~/lib/store-tokens";

const createConfirm = useConfirm();

const store = useStore();

const settings = reactive({
  username: store.profile?.username ?? "",
  private_key: store.profile?.private_key ?? "",
  public_key: store.profile?.public_key ?? "",
});

watch(toRef(store, "profile"), () => {
  settings.username = store.profile?.username ?? "";
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

const avatarInput = ref<HTMLInputElement>();
const avatarVersion = ref(Date.now());

function imageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Invalid image"));
    };
    image.src = url;
  });
}

async function uploadAvatar(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file || !store.api) return;
  if (!["image/png", "image/jpeg"].includes(file.type))
    return toast.error("The avatar must be a PNG or JPEG image.");
  try {
    const { width, height } = await imageSize(file);
    if (width !== height || width < 40 || width > 200)
      return toast.error("The avatar must be square, between 40 and 200 pixels.");
    await store.api.uploadAvatar(file);
    avatarVersion.value = Date.now();
    toast.success("Avatar has been updated.");
  } catch (e) {
    console.error(e);
    toast.error(e instanceof Error && e.message ? e.message : "Error while uploading avatar.");
  }
}

async function removeAvatar() {
  try {
    await store.api?.deleteAvatar();
    avatarVersion.value = Date.now();
    toast.success("Avatar has been removed.");
  } catch (e) {
    console.error(e);
    toast.error("Error while removing avatar.");
  }
}

async function save() {
  try {
    if (store.profile === undefined) throw new Error("User is not logged in.");

    if (!store.api) throw new Error("Store account service is unavailable.");
    const profile = await store.api.updateProfile({
      username: settings.username,
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
        <div class="mr-4 d-flex flex-column align-center">
          <user-avatar
            :user-id="store.profile?.id"
            :version="avatarVersion"
            :size="125"
          />
          <input
            ref="avatarInput"
            type="file"
            accept="image/png,image/jpeg"
            hidden
            @change="uploadAvatar"
          />
          <v-btn
            size="small"
            variant="outlined"
            class="mt-2"
            @click="avatarInput?.click()"
          >
            Change
          </v-btn>
          <v-btn
            size="small"
            variant="text"
            @click="removeAvatar"
          >
            Remove
          </v-btn>
        </div>
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
