<script setup lang="ts">
import { BETA_PUBLIC_KEY, STABLE_PUBLIC_KEY } from '@deconz-community/ddf-bundler'

type KeyType = 'system' | 'user'
interface Signature {
  type?: KeyType
  key: string
}

const props = defineProps<{
  signatures: Signature[]
  only?: KeyType
  noAlphaTag?: boolean
}>()

const store = useStore()

const settings = computed(() => store.state?.context?.settings)

const stableKeys = computed(() => {
  return [
    STABLE_PUBLIC_KEY,
    settings.value?.public_key_stable,
  ].filter(Boolean)
})

const betaKeys = computed(() => {
  return [
    BETA_PUBLIC_KEY,
    settings.value?.public_key_beta,
  ].filter(Boolean)
})

const processedSignatures = computed<Signature[]>(() => {
  return props.signatures.map((signature) => {
    if (signature.type !== undefined)
      return signature

    if (stableKeys.value.includes(signature.key) || betaKeys.value.includes(signature.key)) {
      return {
        key: signature.key,
        type: 'system',
      }
    }
    return {
      key: signature.key,
      type: 'user',
    }
  })
})

const systemFlag = computed(() => {
  if (props.only === 'user')
    return

  const settings = store.state?.context?.settings

  if (!settings) {
    return {
      text: 'Unknown',
      color: 'gray',
    }
  }

  if (processedSignatures.value.some(s => stableKeys.value.includes(s.key))) {
    return {
      text: 'Stable',
      color: 'green',
    }
  }

  if (processedSignatures.value.some(s => betaKeys.value.includes(s.key))) {
    return {
      text: 'Beta',
      color: 'orange',
    }
  }

  if (props.noAlphaTag)
    return

  return {
    text: 'Alpha',
    color: 'red',
  }
})

const userKeys = computed(() => {
  if (props.only === 'system')
    return []
  return processedSignatures.value
    .filter(s => s.type === 'user')
    .map(s => s.key)
})
</script>

<template>
  <template v-if="systemFlag">
    <v-chip v-bind="{ ...systemFlag, ...$attrs }" class="ma-2" variant="flat" />
  </template>

  <template v-for="key in userKeys" :key="key">
    <chip-user v-bind="$attrs" :public-key="key" />
  </template>
</template>
