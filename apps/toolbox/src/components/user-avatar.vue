<script setup lang="ts">
import { retroAvatar } from "~/lib/retro-avatar";

const props = withDefaults(
  defineProps<{
    userId?: string | null;
    size?: number | string;
    version?: number | string;
  }>(),
  { size: 40 },
);

const store = useStore();
const failed = ref(false);

watch(
  () => [props.userId, props.version],
  () => {
    failed.value = false;
  },
);

const src = computed(() => {
  const key = props.userId;
  if (key && !failed.value && store.api) {
    const url = store.api.avatarUrl(key);
    return props.version === undefined ? url : `${url}?v=${props.version}`;
  }
  return retroAvatar(key ?? "");
});
</script>

<template>
  <v-avatar :size="size">
    <img :src="src" alt="avatar" style="width: 100%; height: 100%" @error="failed = true" />
  </v-avatar>
</template>
