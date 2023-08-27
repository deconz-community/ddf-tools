<script lang="ts" setup generic="T extends any">
const props = defineProps<{
  data: Ref<T>
}>()

defineSlots<{
  default: (props: { draft: T }) => any
}>()

const draft = ref(structuredClone(unref(props.data)))

watch(props.data, (newValue) => {
  draft.value = structuredClone(newValue)
})
</script>

<template>
  <div>
    <slot :draft="draft" />
  </div>
</template>
