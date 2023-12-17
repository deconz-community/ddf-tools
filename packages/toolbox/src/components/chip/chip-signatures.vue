<script setup lang="ts">
type KeyType = 'system' | 'user'

const props = defineProps<{
  signatures: { type: KeyType, key: string } []
  only?: KeyType
}>()

const store = useStore()

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

  if (props.signatures.some(s => s.key === settings.public_key_stable)) {
    return {
      text: 'Stable',
      color: 'green',
    }
  }

  if (props.signatures.some(s => s.key === settings.public_key_beta)) {
    return {
      text: 'Beta',
      color: 'orange',
    }
  }

  return {
    text: 'Alpha',
    color: 'red',
  }
})

const userKeys = computed(() => {
  if (props.only === 'system')
    return []
  return props.signatures
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
