<script setup lang="ts">
import { useConfirm, useSnackbar } from 'vuetify-use-dialog'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils'
import { secp256k1 } from '@noble/curves/secp256k1'
import { usePocketBase } from '~/composables/usePocketbase'
import { useGithubAvatar } from '~/composables/useGithubAvatar'

const props = defineProps<{
  user: string
}>()

const createConfirm = useConfirm()
const createSnackbar = useSnackbar()
const pb = usePocketBase()

const settings = reactive({
  private_key: pb.client.authStore.model?.private_key,
  public_key: pb.client.authStore.model?.public_key,
})

const errorMessage = ref('')

const generateKeys = async () => {
  settings.private_key = bytesToHex(secp256k1.utils.randomPrivateKey())
}

// Update public key when private key changes
watch(toRef(settings, 'private_key'), () => {
  try {
    settings.public_key = bytesToHex(secp256k1.getPublicKey(hexToBytes(settings.private_key)))
    errorMessage.value = ''
  }
  catch (e) {
    errorMessage.value = 'Invalid private key.'
  }
})

const saveKeys = async () => {
  const isConfirmed = await createConfirm({
    content: 'Any bundles signed with the old keys will no longer be valid.',
  })

  if (!isConfirmed)
    return

  try {
    if (pb.client.authStore.model?.id === undefined)
      throw new Error('User is not logged in.')

    await pb.client.collection(pb.client.authStore.model?.collectionId).update(pb.client.authStore.model?.id, {
      private_key: settings.private_key,
      public_key: settings.public_key,
    })
  }
  catch (e) {
    console.error(e)
    return createSnackbar({ text: 'Error while saving keys.', snackbarProps: { color: 'error' } })
  }

  createSnackbar({ text: 'New keys has been saved.', snackbarProps: { color: 'success' } })
}

const avatar = useGithubAvatar(computed(() => pb.profile.value?.github_id), 125)
const userProfilLink = computed(() => `https://github.com/${pb.client.authStore.model?.username}`)
</script>

<template>
  <v-card class="ma-2" title="Account Details">
    <v-card-text>
      <div class="d-flex">
        <v-avatar class="ma-2" :image="avatar" size="125" />
        <v-card
          class="ma-2 flex-grow-1"
          :title="pb.client.authStore.model?.username"
          :subtitle="pb.client.authStore.model?.email"
        >
          <v-card-text>
            <v-btn :href="userProfilLink" target="_blank">
              Github profile
            </v-btn>
          </v-card-text>
        </v-card>
      </div>

      <v-card
        class="ma-2 flex-grow-1"
        title="Bundle Signature"
        variant="outlined"
        elevation="1"
      >
        <v-card-text>
          <v-text-field
            v-model="settings.private_key"
            label="Signature private key"
            :error-messages="errorMessage"
          />
          <v-text-field
            v-model="settings.public_key"
            label="Signature public key"
            readonly
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="outlined" @click="generateKeys">
            Generate new keys
          </v-btn>
          <v-btn variant="outlined" @click="saveKeys">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-card-text>
  </v-card>
</template>

<route lang="json">
{
  "meta": {
    "requiresAuth": true,
    "requiresPersonnalAuth": true
  }
}
</route>
