<script lang="ts" setup generic="T extends any">
import { produce } from 'immer'

const props = defineProps<{
  data: Ref<T>
}>()

defineSlots<{
  default: (props: { draft: T }) => any
}>()

const draft = useCloned(props.data, {
  clone: data => produce(data, () => { }),
})
</script>

<template>
  <div>
    <slot :draft="draft" />
  </div>
</template>
