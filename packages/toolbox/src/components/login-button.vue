<script setup lang="ts">
import { getCurrentInstance } from 'vue'
import { useSnackbar } from 'vuetify-use-dialog'
import { useGithubAvatar } from '~/composables/useGithubAvatar'
import { usePocketBase } from '~/composables/usePocketbase'

const instance = getCurrentInstance()
const { client, profile } = usePocketBase()

const router = useRouter()
const route = useRoute()
const createSnackbar = useSnackbar()

client.authStore.onChange(() => {
  instance?.proxy?.$forceUpdate()

  // If the user is not logged in on a page that require auth, redirect him to the home page
  if (!client.authStore.isValid && route.meta.requiresAuth === true)
    router.push({ path: '/' })
})

const avatarSize = 50
const avatarUrl = useGithubAvatar(computed(() => profile.value?.github_id), avatarSize - 2)

async function login() {
  try {
    const result = await client.collection('user').authWithOAuth2({ provider: 'github' })
    if (result.meta) {
      const updateFields: Record<string, string> = {}
      for (const field of ['email', 'username']) {
        if (result.meta[field] !== result.record[field])
          updateFields[field] = result.meta[field]
      }
      if (Object.keys(updateFields).length > 0) {
        createSnackbar({ text: 'Updating user profile.' })
        await client.collection('user').update(result.record.id, updateFields)
      }
    }
    createSnackbar({ text: `Logged in as ${result.record.username}.` })
  }
  catch (e) {
    console.error(e)
    createSnackbar({ text: 'Something went wrong during login.', snackbarProps: { color: 'error' } })
  }
}

async function logout() {
  client.authStore.clear()
  createSnackbar({ text: 'Logged out.' })
}
</script>

<template>
  <template v-if="client.authStore.isValid && client.authStore.model">
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
          :title="client.authStore.model.name ?? client.authStore.model.username"
        />
        <v-divider />
        <v-list-item
          prepend-icon="mdi-account"
          title="Profile"
          :to="`/user/${client.authStore.model.id}`"
        />
        <v-list-item
          prepend-icon="mdi-cog"
          title="Account"
          :to="`/user/${client.authStore.model.id}/settings`"
        />
        <v-list-item
          prepend-icon="mdi-logout"
          title="Sign Out"
          @click="logout()"
        />
      </v-list>
    </v-menu>
  </template>
  <template v-else>
    <v-btn
      prepend-icon="mdi-login"
      @click="login()"
    >
      Login with GitHub
    </v-btn>
  </template>
</template>
