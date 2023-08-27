<script lang="ts" setup generic="T extends Record<string, any>">
const props = defineProps<{
  data: () => T
}>()

defineSlots<{
  default: (props: { draft: T }) => any
}>()

const draft = ref(structuredClone(props.data()))

watch(toRef(() => props.data()), (newValue) => {
  draft.value = structuredClone(newValue)
})
</script>

<template>
  <div>
    <slot :draft="draft" />
  </div>
</template>
