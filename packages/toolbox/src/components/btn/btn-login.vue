<script setup lang="ts">
import { useSnackbar } from 'vuetify-use-dialog'
import { useGithubAvatar } from '~/composables/useGithubAvatar'

const store = useStore()
const createSnackbar = useSnackbar()

const avatarSize = 50
const avatarUrl = useGithubAvatar(computed(() => store.client?.authStore.model?.github_id), avatarSize - 2)

async function login() {
  try {
    if (!store.client)
      return

    const result = await store.client.collection('user').authWithOAuth2({ provider: 'github' })
    createSnackbar({ text: `Logged in as ${result.record.username}.` })
  }
  catch (e) {
    console.error(e)
    createSnackbar({ text: 'Something went wrong during login.', snackbarProps: { color: 'error' } })
  }
}

async function logout() {
  store.client?.authStore.clear()
  createSnackbar({ text: 'Logged out.' })
}
</script>

<template>
  <template v-if="store.state?.matches('online.connected')">
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
          :title="store.client?.authStore.model?.name ?? store.client?.authStore.model?.username"
        />
        <v-divider />
        <v-list-item
          prepend-icon="mdi-account"
          title="Profile"
          :to="`/user/${store.client?.authStore.model?.id}`"
        />
        <v-list-item
          prepend-icon="mdi-cog"
          title="Account"
          :to="`/user/${store.client?.authStore.model?.id}/settings`"
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
      @click="login()"
    >
      Login with GitHub
    </v-btn>
  </template>
</template>
