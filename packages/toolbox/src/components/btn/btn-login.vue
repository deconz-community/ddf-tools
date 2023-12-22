<script setup lang="ts">
import { useSnackbar } from 'vuetify-use-dialog'

const store = useStore()
const createSnackbar = useSnackbar()

const avatarSize = 50
const avatarUrl = computed(() => store.profile?.avatar_url as string ?? '')
const userName = computed(() => {
  if (!store.profile)
    return undefined
  return `${store.profile.first_name ?? ''} ${store.profile.last_name ?? ''}`.trim()
})

const loginUrl = computed(() => {
  const baseUrl = store.state?.context.directusUrl
  if (!baseUrl)
    return undefined

  const url = new URL(`${baseUrl}/auth/login/github`)
  url.search = new URLSearchParams({
    redirect: window.location.href,
  }).toString()

  return url.href
})

async function logout() {
  await store.client?.logout()
  store.send({ type: 'LOGOUT' })
  createSnackbar({ text: 'Logged out.' })
}
</script>

<template>
  <template v-if="store.state?.matches('online.connected') && store.profile">
    <v-menu
      width="200"
    >
      <template #activator="{ props }">
        <btn-rounded-circle
          v-bind="props"
          :height="avatarSize"
          :width="avatarSize"
        >
          <v-avatar :image="avatarUrl" alt="User avatar" :size="avatarSize - 2" />
        </btn-rounded-circle>
      </template>
      <v-list>
        <v-list-item
          prepend-icon="mdi-account"
          :title="userName"
        />
        <v-divider />
        <v-list-item
          prepend-icon="mdi-account"
          title="Profile"
          :to="`/user/${store.profile.id}`"
        />
        <v-list-item
          prepend-icon="mdi-cog"
          title="Account"
          :to="`/user/${store.profile.id}/settings`"
        />
        <v-list-item
          prepend-icon="mdi-logout"
          title="Sign Out"
          @click="logout()"
        />
      </v-list>
    </v-menu>
  </template>
  <template v-else-if="store.state?.matches('online.anonymous')">
    <v-btn
      prepend-icon="mdi-login"
      :href="loginUrl"
    >
      Login with GitHub
    </v-btn>
  </template>
</template>
