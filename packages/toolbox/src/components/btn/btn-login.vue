<script setup lang="ts">
import { useSnackbar } from 'vuetify-use-dialog'

const store = useStore()
const createSnackbar = useSnackbar()

const avatarSize = 50
const avatarUrl = computed(() => store.profile?.avatar_url ?? '')
const userName = computed(() => {
  if (!store.profile)
    return undefined
  return `${store.profile.first_name ?? ''} ${store.profile.last_name ?? ''}`.trim()
})

async function logout() {
  store.send({ type: 'LOGOUT' })
  createSnackbar({ text: 'Logged out.' })
}

const loginEmail = ref('')
const loginPassword = ref('')
const showPassword = ref(false)

async function login() {
  store.send({ type: 'LOGIN_WITH_PASSWORD', email: loginEmail.value, password: loginPassword.value })
}
</script>

<template>
  <template v-if="store.state?.matches({ online: { auth: 'connected' } }) && store.profile">
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
          :to="`/store/user/${store.profile.id}`"
        />
        <v-list-item
          prepend-icon="mdi-cog"
          title="Account"
          :to="`/store/user/${store.profile.id}/settings`"
        />
        <v-list-item
          prepend-icon="mdi-logout"
          title="Sign Out"
          @click="logout()"
        />
      </v-list>
    </v-menu>
  </template>
  <template v-else-if="store.state?.matches({ online: { auth: 'anonymous' } })">
    <v-dialog max-width="500">
      <template #activator="{ props: activatorProps }">
        <v-btn
          v-bind="activatorProps"
          prepend-icon="mdi-login"
          text="Login"
        />
      </template>

      <template #default="{ isActive }">
        <v-card title="Authenticate to the DDF Bundle store">
          <v-form @submit.prevent="() => { login();isActive.value = false }">
            <v-card-text>
              <v-text-field
                v-model="loginEmail"
                label="Email"
                name="login-email"
                autocomplete="username"
                required
              />
              <v-text-field
                v-model="loginPassword"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                :type="showPassword ? 'text' : 'password'"
                label="Password"
                name="login-password"
                autocomplete="current-password"
                @click:append="showPassword = !showPassword"
              />
            </v-card-text>

            <v-card-actions>
              <v-spacer />
              <v-btn
                text="Cancel"
                @click="isActive.value = false"
              />
              <v-btn
                text="Login"
                type="submit"
              />
            </v-card-actions>
          </v-form>
        </v-card>
      </template>
    </v-dialog>
  </template>
</template>
