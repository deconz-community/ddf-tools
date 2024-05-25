<script setup lang="ts">
import { passwordRequest } from '@directus/sdk'
import { toastError } from '~/lib/handleError'

const store = useStore()

const avatarSize = 50
const avatarUrl = computed(() => store.profile?.avatar_url ?? '')
const userName = computed(() => {
  if (!store.profile)
    return undefined
  return `${store.profile.first_name ?? ''} ${store.profile.last_name ?? ''}`.trim()
})

async function logout() {
  store.send({ type: 'LOGOUT' })
}

const loginEmail = ref('')
const loginPassword = ref('')
const showPassword = ref(false)

async function login() {
  store.send({ type: 'LOGIN_WITH_PASSWORD', email: loginEmail.value, password: loginPassword.value })
}

async function passwordReset() {
  if (loginEmail.value === '')
    return toast.error('Please enter your email address')

  try {
    await store.client?.request(passwordRequest(
      loginEmail.value,
      import.meta.env.VITE_DIRECTUS_PASSWORD_RESET_URL,
    ))

    toast.success('Email sent')
  }
  catch (error) {
    toastError(error)
  }
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
          <v-avatar :size="avatarSize - 2">
            <v-img
              v-if="avatarUrl"
              :src="avatarUrl"
              alt="User avatar"
            />
            <v-icon
              v-else
              icon="mdi-account"
              size="40"
              color="grey lighten-1"
            />
          </v-avatar>
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
          to="/store/user/me/settings"
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
          append-icon="mdi-login"
          text="DDF Store Login"
          variant="flat"
          elevation="1"
          color="primary"
        />
      </template>

      <template #default="{ isActive }">
        <v-card title="Enter your credentials for DDF bundle store">
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
                variant="flat"
                color="error"
                @click="isActive.value = false"
              />
              <v-btn
                text="Password Reset"
                variant="flat"
                color="secondary"
                @click="passwordReset()"
              />
              <v-btn
                text="Register"
                variant="flat"
                color="secondary"
                :to="{ path: '/store/user/me/register' }"
                @click="isActive.value = false"
              />
              <v-btn
                text="Login"
                append-icon="mdi-login"
                type="submit"
                color="primary"
                variant="flat"
              />
            </v-card-actions>
          </v-form>
        </v-card>
      </template>
    </v-dialog>
  </template>
</template>
