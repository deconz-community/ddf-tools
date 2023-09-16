<script setup lang="ts">
import { createSignature, verifySignature } from '@deconz-community/ddf-bundler'
import type { ChunkSignature } from '@deconz-community/ddf-bundler'
import { useConfirm } from 'vuetify-use-dialog'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils'
import { secp256k1 } from '@noble/curves/secp256k1'

const props = defineProps<{
  modelValue: ChunkSignature[]
  hash?: Uint8Array
}>()

const emit = defineEmits(['update:modelValue'])

const signatures = useVModel(props, 'modelValue', emit)
const hash = useVModel(props, 'hash')

const createConfirm = useConfirm()

const tableHeaders = [
  {
    title: 'User',
    align: 'start',
    order: 'asc',
    sortable: true,
    key: 'key',
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
  },

  { title: 'Actions', key: 'actions', sortable: false },

] as const

const tableItems = computedAsync(async () => {
  return await Promise.all(signatures.value.map(async (signature: { key: Uint8Array; signature: Uint8Array }) => {
    if (hash.value) {
      return {
        key: bytesToHex(signature.key),
        signature: bytesToHex(signature.signature),
        valid: (await verifySignature(hash.value, signature.key, signature.signature)),
      }
    }
  }))
}, [])

const privateKey = ref(secp256k1.utils.randomPrivateKey())
const privateKeyHex = computed({
  get() {
    return bytesToHex(privateKey.value)
  },
  set(newValue) {
    privateKey.value = hexToBytes(newValue)
  },
})

function generatePrivateKey() {
  privateKey.value = secp256k1.utils.randomPrivateKey()
}

async function newSignature() {
  if (!hash.value)
    return

  const key = privateKey.value
  const signature = createSignature(hash.value, key)
  const publicKey = secp256k1.getPublicKey(key)
  signatures.value.push({
    key: publicKey,
    signature,
  })
}

async function deleteSignature(index: number) {
  const signature = tableItems.value[index]?.signature
  const isConfirmed = await createConfirm({
    content: `Delete signature '${signature}'`,
  })

  if (!isConfirmed)
    return

  signatures.value.splice(index, 1)
}
</script>

<template>
  <v-text-field
    v-model="privateKeyHex"
    label="Private key"
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

  <v-data-table
    :headers="tableHeaders"
    :items="tableItems"
    item-value="name"
    class="elevation-1"
  >
    <!-- eslint-disable vue/valid-v-slot -->
    <template #top>
      <v-toolbar>
        <v-spacer />
        <v-btn
          variant="tonal"
          prepend-icon="mdi-file-sign"
          :disabled="hash === undefined"
          @click="newSignature()"
        >
          Sign
        </v-btn>
      </v-toolbar>
    </template>
    <template #item.key="{ item }">
      ...{{ item.columns.key.slice(-10) }}
    </template>
    <template #item.signature="{ item }">
      ...{{ item.columns.signature.slice(-10) }}
    </template>
    <template #item.valid="{ item }">
      <v-chip v-if="item.columns.valid" color="green">
        Yes
      </v-chip>
      <v-chip v-else color="red">
        No
      </v-chip>
    </template>
    <template #item.actions="{ item }">
      <v-btn class="ma-2" icon="mdi-delete" @click="deleteSignature(item.index)" />
    </template>
  </v-data-table>
</template>
