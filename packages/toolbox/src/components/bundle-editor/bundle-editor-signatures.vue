<script setup lang="ts">
import type { ChunkSignature } from '@deconz-community/ddf-bundler'
import { createSignature, verifySignature } from '@deconz-community/ddf-bundler'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import { getPublicKey, utils } from '@noble/secp256k1'
import { useConfirm } from 'vuetify-use-dialog'

import { VDataTable } from 'vuetify/components'

const props = defineProps<{
  modelValue: ChunkSignature[]
  hash?: Uint8Array
  disabled?: boolean
}>()

const emit = defineEmits(['update:modelValue', 'change'])

const signatures = useVModel(props, 'modelValue', emit)
const disabled = useVModel(props, 'disabled')
const hash = useVModel(props, 'hash')
const store = useStore()
const createConfirm = useConfirm()

const canUseStore = computed(() => {
  return store.state?.matches({ online: { auth: 'connected' } })
})

const tableHeaders: VDataTable['headers'] = [
  {
    title: 'User',
    align: 'start',
    order: 'asc',
    sortable: true,
    key: 'key',
    width: '180px',
  },
  {
    title: 'Signature',
    align: 'start',
    order: 'asc',
    sortable: true,
    key: 'signature',
  },
  {
    title: 'Valid',
    align: 'start',
    order: 'asc',
    sortable: true,
    key: 'valid',
    width: '45px',
  },
  {
    title: 'Actions',
    key: 'actions',
    sortable: false,
    width: '45px',
  },
]

const tableItems = computedAsync(async () => {
  return await Promise.all(signatures.value.map(async (signature: { key: Uint8Array, signature: Uint8Array }) => {
    if (hash.value) {
      return {
        key: bytesToHex(signature.key),
        signature: bytesToHex(signature.signature),
        valid: (await verifySignature(hash.value, signature.key, signature.signature)),
      }
    }
  }))
}, [])

const storeKey = computed(() => {
  // TODO remove as string
  return canUseStore.value ? store.profile?.private_key as string : undefined
})

const privateKey = ref(utils.randomSecretKey())
const privateKeyHex = computed({
  get() {
    return bytesToHex(privateKey.value)
  },
  set(newValue) {
    privateKey.value = hexToBytes(newValue)
  },
})

function generatePrivateKey() {
  privateKey.value = utils.randomSecretKey()
}

async function signBundle() {
  let key: Uint8Array | undefined
  if (!hash.value)
    return toast.error('Error: Bundle don\'t have a hash')

  if (canUseStore.value === true) {
    key = storeKey.value ? hexToBytes(storeKey.value) : undefined
    if (!key)
      return toast.error('Error: You don\'t have a private key. Please check your user profile.')
  }
  else {
    key = privateKey.value
  }

  const signature = createSignature(hash.value, key)
  const publicKey = getPublicKey(key)
  const publicKeyHex = bytesToHex(publicKey)

  const existingSignature = signatures.value.find(signature => bytesToHex(signature.key) === publicKeyHex)
  if (existingSignature) {
    if (await verifySignature(hash.value, existingSignature.key, existingSignature.signature))
      return toast.error('Error: You already signed this bundle')
    signatures.value.splice(signatures.value.indexOf(existingSignature), 1)
  }

  signatures.value.push({
    key: publicKey,
    signature,
  })
  emit('change')
  toast.success(`Signature ${existingSignature ? 'updated' : 'added'}`)
}

async function deleteSignature(index: number) {
  const signature = tableItems.value[index]?.signature
  const isConfirmed = await createConfirm({
    content: `Delete signature '${signature}'`,
  })

  if (!isConfirmed)
    return

  signatures.value.splice(index, 1)
  emit('change')
  toast.success('Signature removed')
}

if (import.meta.env.VITE_DEBUG === 'true') {
  onMounted(() => {
    // signBundle()
  })
}
</script>

<template>
  <v-text-field
    v-if="canUseStore === false || storeKey === undefined"
    v-model="privateKeyHex"
    label="Custom private key"
  >
    <template #prepend>
      <v-tooltip location="bottom">
        <template #activator="{ props: localProps }">
          <v-icon
            v-bind="localProps" icon="mdi-refresh"
            @click="generatePrivateKey()"
          />
        </template>
        Generate a new private key
      </v-tooltip>
    </template>
  </v-text-field>

  <VDataTable
    :headers="tableHeaders"
    :items="tableItems"
    item-value="name"
    class="elevation-1"
  >
    <!-- eslint-disable vue/valid-v-slot -->
    <template #top>
      <v-toolbar>
        <v-toolbar-title v-if="canUseStore">
          Using {{ store.profile?.first_name }}'s key
        </v-toolbar-title>
        <v-toolbar-title v-else>
          Using custom key
        </v-toolbar-title>
        <v-spacer />

        <v-fade-transition>
          <span v-show="disabled" class="ma-3">
            Save changes before signing
          </span>
        </v-fade-transition>
        <v-btn
          variant="tonal"
          prepend-icon="mdi-file-sign"
          :disabled="hash === undefined || disabled"
          @click="signBundle()"
        >
          Sign
        </v-btn>
      </v-toolbar>
    </template>
    <template #item.key="{ item }">
      <chip-signatures v-if="item" :no-alpha-tag="true" :signatures="[{ key: item.key }]" />
    </template>
    <template #item.signature="{ item }">
      <v-text-field
        v-model="item.signature"
        readonly
        class="ma-2"
        variant="solo"
        hide-details="auto"
      />
    </template>
    <template #item.valid="{ item }">
      <v-chip v-if="item.valid" color="green">
        Yes
      </v-chip>
      <v-chip v-else color="red">
        No
      </v-chip>
    </template>
    <template #item.actions="{ item }">
      <v-btn class="ma-2" icon="mdi-delete" @click="deleteSignature(item.index)" />
    </template>
  </VDataTable>
</template>
