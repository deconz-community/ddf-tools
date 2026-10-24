<script setup lang="ts">
import { bytesToHex } from "@noble/hashes/utils.js";

const props = defineProps<{
  publicKey?: string | Uint8Array;
}>();

const menu = ref(false);

const store = useStore();

const userKey = computed(() => {
  switch (typeof props.publicKey) {
    case "string":
      return props.publicKey;
    case "undefined":
      return undefined;
    default:
      return bytesToHex(props.publicKey);
  }
});

const user = computedAsync<any | undefined>(async () => {
  // TODO cache this too
  if (userKey.value && store.state?.matches("online"))
    return await store.getUserByKey(userKey.value);
});

const userName = computed(() =>
  user.value
    ? (user.value.username ?? "Unknown user")
    : "Unknown user",
);

function copyUserKeyToClipboard() {
  if (!userKey.value) return toast.error("No key to copy");
  try {
    navigator.clipboard.writeText(userKey.value);
    toast.success("Key copied to clipboard");
  } catch (e) {
    toast.error("Error: Can't copy key to clipboard");
  }
}
</script>

<template>
  <v-menu v-model="menu" location="top start" origin="top start" transition="scale-transition">
    <template #activator="{ props: menu_props }">
      <v-chip
        pill
        v-bind="{ ...menu_props, ...$attrs }"
        link
        :color="user?.is_contributor ? 'primary' : 'secondary'"
      >
        <user-avatar :user-id="user?.id" :size="24" class="mr-2" />
        {{ user?.username ?? "Unknown user" }}
      </v-chip>
    </template>

    <v-card width="400">
      <v-list bg-color="black">
        <v-list-item>
          <template #prepend>
            <user-avatar :user-id="user?.id" :size="50" />
          </template>
          <v-list-item-title>
            {{ userName }}
            <v-chip
              pill
              :color="user?.is_contributor ? 'primary' : 'secondary'"
              text="Contributor"
              variant="flat"
              class="ml-2 mb-1"
            />
          </v-list-item-title>

          <v-list-item-subtitle v-if="user">
            Member since {{ useTimeAgo(user.date_created).value }}
          </v-list-item-subtitle>

          <template #append>
            <v-list-item-action>
              <v-btn icon variant="text" @click="menu = false">
                <v-icon>mdi-close-circle</v-icon>
              </v-btn>
            </v-list-item-action>
          </template>
        </v-list-item>
      </v-list>

      <v-list>
        <v-list-item
          v-if="user"
          :title="`${userName}'s profile`"
          prepend-icon="mdi-account"
          :to="`/store/user/${user.id}`"
        />

        <v-tooltip text="Copy signature key to clipboard" location="top">
          <template #activator="{ props: localProps }">
            <v-list-item
              v-if="userKey"
              title="Public signature key"
              :subtitle="userKey"
              prepend-icon="mdi-file-sign"
              v-bind="localProps"
              @click="copyUserKeyToClipboard()"
            />
          </template>
        </v-tooltip>
      </v-list>
    </v-card>
  </v-menu>
</template>
