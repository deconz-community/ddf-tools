<script setup lang="ts">
import { bytesToHex } from '@noble/hashes/utils'
import { MD5 } from 'crypto-js'

const props = defineProps<{
  publicKey?: string | Uint8Array
}>()

const menu = ref(false)

const store = useStore()

const userKey = computed(() => {
  switch (typeof props.publicKey) {
    case 'string':
      return props.publicKey
    case 'undefined':
      return undefined
    default:
      return bytesToHex(props.publicKey)
  }
})

const user = computedAsync<any | undefined>(async () => {
  // TODO cache this too
  if (userKey.value && store.state?.matches('online'))
    return await store.getUserByKey(userKey.value)
})

const userAvatar = computed(() => {
  if (typeof user.value?.avatar_url === 'string') {
    return user.value.avatar_url
  }
  else {
    const hash = userKey.value ? MD5(userKey.value) : '00000000000000000000000000000000'
    const url = new URL(`https://www.gravatar.com/avatar/${hash}`)
    url.searchParams.append('d', 'retro')
    return url.href
  }
})

const userName = computed(() => user.value
  ? (`${user.value.first_name ?? ''} ${user.value.last_name ?? ''}`.trim())
  : 'Unknown user',
)

function copyUserKeyToClipboard() {
  if (!userKey.value)
    return toast.error('No key to copy')
  try {
    navigator.clipboard.writeText(userKey.value)
    toast.success('Key copied to clipboard')
  }
  catch (e) {
    toast.error('Error: Can\'t copy key to clipboard')
  }
}
</script>

<template>
  <v-menu
    v-model="menu"
    location="top start"
    origin="top start"
    transition="scale-transition"
  >
    <template #activator="{ props: menu_props }">
      <v-chip
        pill
        v-bind="{ ...menu_props, ...$attrs }"
        link
      >
        <v-avatar start>
          <v-img :src="userAvatar" />
        </v-avatar>
        {{ user?.first_name ?? 'Unknown user' }}
      </v-chip>
    </template>

    <v-card width="300">
      <v-list bg-color="black">
        <v-list-item>
          <!--
          <template #prepend>
            <v-avatar :image="userAvatar" />
          </template>
          -->

          <v-list-item-title>
            {{ userName }}
          </v-list-item-title>

          <v-list-item-subtitle v-if="user">
            Member since {{ useTimeAgo(user.date_created).value }}
          </v-list-item-subtitle>

          <template #append>
            <v-list-item-action>
              <v-btn
                icon
                variant="text"
                @click="menu = false"
              >
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
