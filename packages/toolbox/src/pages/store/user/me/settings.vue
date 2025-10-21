<script setup lang="ts">
import { useConfirm } from 'vuetify-use-dialog'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import { utils, getPublicKey} from '@noble/secp256k1'
import { RestCommand, updateMe } from '@directus/sdk'

const createConfirm = useConfirm()

// https://github.com/directus/directus/issues/22571
const randomString = <Schema>(length?: number): RestCommand<string, Schema> =>
  () => ({
    method: 'GET',
    path: `/utils/random/string`,
    params: length !== undefined ? { length } : undefined,
  });

const store = useStore()

const settings = reactive({
  first_name: store.profile?.first_name ?? '',
  email: store.profile?.email ?? '',
  token: store.profile?.token ?? '',
  isNewToken: false,
  private_key: store.profile?.private_key ?? '',
  public_key: store.profile?.public_key ?? '',
})

watch(toRef(store, 'profile'), () => {
  settings.first_name = store.profile?.first_name ?? ''
  settings.email = store.profile?.email ?? ''
  if (settings.token === '')
    settings.token = store.profile?.token ?? ''
  settings.isNewToken = false
  settings.private_key = store.profile?.private_key ?? ''
  settings.public_key = store.profile?.public_key ?? ''
})

const errorMessage = ref('')
const avatarFile = ref<File[]>([])

async function generateKeys() {
  if (settings.private_key) {
    const isConfirmed = await createConfirm({
      title: 'Generate new keys',
      content: 'Any bundles signed with the old keys will no longer be valid.',
    })

    if (!isConfirmed)
      return
  }

  settings.private_key = bytesToHex(utils.randomSecretKey())
}

// Update public key when private key changes
watch(toRef(settings, 'private_key'), () => {
  try {
    if (!settings.private_key)
      throw new Error('An error occurred.')

    settings.public_key = bytesToHex(getPublicKey(hexToBytes(settings.private_key)))
    errorMessage.value = ''
  }
  catch (e) {
    errorMessage.value = 'Invalid private key.'
  }
})

async function save() {
  try {
    if (store.profile === undefined)
      throw new Error('User is not logged in.')

    /*
    let newAvatarId: string | null = store.profile.avatar as string

    if (avatarFile.value.length > 0) {
      const formData = new FormData()
      formData.append('file', avatarFile.value[0])
      if (!newAvatarId) {
        const avatar = await store.client?.request(uploadFiles(formData))
        newAvatarId = avatar?.id ?? null
      }
      else {
        // TODO
        const result = await store.client?.request(updateFile(newAvatarId, formData))
        console.log(result)
      }
    }
    */

    const profile = await store.client?.request(updateMe({
      first_name: settings.first_name,
      email: settings.email,
      ...(settings.isNewToken ? { token: settings.token } : {}),
      private_key: settings.private_key,
      public_key: settings.public_key,
    }))

    store.send({ type: 'UPDATE_PROFILE', profile: profile as any })
  }
  catch (e) {
    console.error(e)
    return toast.error('Error while saving user profile.')
  }

  toast.success('User profile has been saved.')
}

const avatarPreview = computed(() => {
  const avatar = avatarFile.value[0]
  return avatar ? URL.createObjectURL(avatar) : null
})

async function generateToken() {
  settings.token = await store.client?.request(randomString()) ?? ''
  settings.isNewToken = true
}

// const userProfilLink = computed(() => `https://github.com/${store.client?.authStore.model?.username}`)
</script>

<template>
  <v-card class="ma-2" title="Account Details">
    <v-card-text>
      <div class="d-flex mb-5">
        <v-avatar size="125" variant="outlined" class="mr-4">
          <v-img v-if="store.profile?.avatar_url" :src="store.profile?.avatar_url" alt="avatar" size="125" />
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
          <v-card-text>
            Hello
          </v-card-text>
        </v-card>
      </div>
      <v-text-field v-model="settings.first_name" label="Username" />
      <v-text-field v-model="settings.email" label="Email" />
      <!--
      <div class="d-flex">
        <v-avatar
          size="56"
          variant="outlined"
          class="mr-4"
        >
          <v-img
            v-if="avatarPreview"
            :src="avatarPreview"
            alt="avatar"
          />
          <v-icon
            v-else
            icon="mdi-account"
            size="46"
            color="grey lighten-1"
          />
        </v-avatar>

        <v-file-input
          v-model="avatarFile"
          label="Avatar"
          prepend-icon="mdi-camera"
          accept="image/*"
          autocomplete="photo"
        />
      </div>
      -->

      <v-divider class="mb-5" />
      <v-text-field v-model="settings.token" label="Static authentication token"
        hint="This token is used to authenticate the user in various tools." readonly append-icon="mdi-reload"
        @click:append="generateToken()" />
      <v-text-field v-model="settings.private_key" label="Signature private key" :error-messages="errorMessage"
        append-icon="mdi-reload" @click:append="generateKeys" />
      <v-text-field v-model="settings.public_key" label="Signature public key" readonly />
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn variant="outlined" @click="save">
        Save
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<route lang="json">{
  "meta": {
    "requiresAuth": true,
    "hideLevelTwoSidebar": true
  }
}</route>
