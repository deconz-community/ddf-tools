<script setup lang="ts">
import { bytesToHex } from '@noble/hashes/utils'
import { useTimeAgo } from '@vueuse/core'
import { MD5 } from 'crypto-js'
import { type UserResponse } from '~/interfaces/store'

const props = defineProps<{
  user?: UserResponse
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

const user = computedAsync<UserResponse | undefined>(async () => {
  if (props.user)
    return props.user

  if (userKey.value && store.state?.matches('online.connected'))
    return await store.getUserByKey(userKey.value)
}, props.user)

const userAvatar = computed(() => {
  if (user.value?.github_id) {
    return `https://avatars.githubusercontent.com/u/${user.value.github_id}?v=4`
  }
  else {
    const hash = userKey.value ? MD5(userKey.value) : '00000000000000000000000000000000'
    const url = new URL(`https://www.gravatar.com/avatar/${hash}`)
    url.searchParams.append('d', 'retro')
    return url.href
  }
})

const userName = computed(() => user.value?.name ?? 'Unknown user')
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
        {{ user?.name ?? 'Unknown user' }}
      </v-chip>
    </template>

    <v-card width="300">
      <v-list bg-color="black">
        <v-list-item>
          <template #prepend>
            <v-avatar :image="userAvatar" />
          </template>

          <v-list-item-title>
            {{ userName }}
          </v-list-item-title>

          <v-list-item-subtitle v-if="user">
            Member since {{ useTimeAgo(user.created).value }}
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
          :to="`/user/${user.id}`"
        />
        <v-list-item
          v-if="userKey"
          title="Public key"
          :subtitle="userKey"
          prepend-icon="mdi-file-sign"
        />
      </v-list>
    </v-card>
  </v-menu>
</template>
