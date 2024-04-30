<script setup lang="ts">
import { useConfirm } from 'vuetify-use-dialog'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils'
import { secp256k1 } from '@noble/curves/secp256k1'
import { updateMe } from '@directus/sdk'

const props = defineProps<{
  user: string
}>()

const createConfirm = useConfirm()

const store = useStore()

const settings = reactive({
  private_key: store.profile?.private_key as string,
  public_key: store.profile?.public_key as string,
})

const errorMessage = ref('')

async function generateKeys() {
  settings.private_key = bytesToHex(secp256k1.utils.randomPrivateKey())
}

// Update public key when private key changes
watch(toRef(settings, 'private_key'), () => {
  try {
    if (!settings.private_key)
      throw new Error('An error occurred.')

    settings.public_key = bytesToHex(secp256k1.getPublicKey(hexToBytes(settings.private_key)))
    errorMessage.value = ''
  }
  catch (e) {
    errorMessage.value = 'Invalid private key.'
  }
})

async function saveKeys() {
  const isConfirmed = await createConfirm({
    content: 'Any bundles signed with the old keys will no longer be valid.',
  })

  if (!isConfirmed)
    return

  try {
    if (store.profile === undefined)
      throw new Error('User is not logged in.')

    await store.client?.request(updateMe({
      private_key: settings.private_key,
      public_key: settings.public_key,
    }))
  }
  catch (e) {
    console.error(e)
    return toast.error('Error while saving keys.')
  }

  toast.success('New keys has been saved.')
}

// const userProfilLink = computed(() => `https://github.com/${store.client?.authStore.model?.username}`)
</script>

<template>
  <v-card class="ma-2" title="Account Details">
    <v-card-text>
      <div class="d-flex">
        <v-avatar class="ma-2" :image="store.profile?.avatar_url" size="125" />
        <v-card
          class="ma-2 flex-grow-1"
          :title="`${store.profile?.first_name ?? ''} ${store.profile?.last_name ?? ''}`"
          :subtitle="store.profile?.email ?? undefined"
        >
          <v-card-text>
            <!--
            <v-btn :href="userProfilLink" target="_blank">
              Github profile
            </v-btn>
          -->
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
