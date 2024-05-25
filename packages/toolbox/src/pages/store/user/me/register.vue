<script setup lang="ts">
import { registerUser } from '@directus/sdk'
import { useVuelidate } from '@vuelidate/core'
import { email, helpers, minLength, required, sameAs } from '@vuelidate/validators'
import { toastError } from '~/lib/handleError'

const store = useStore()

const initialState = {
  username: '',
  email: '',
  password: '',
  password_confirm: '',
}

const state = reactive({
  ...initialState,
})

const baseMessage = 'Password must contain at least one'

const rules = {
  username: {
    required,
  },
  email: {
    required,
    email,
  },
  password: {
    required,
    minLength: minLength(10),
    includeNumbers: helpers.withMessage(
      `${baseMessage} number`,
      helpers.regex(/(?=.\d)/),
    ),
    includeLowercase: helpers.withMessage(
      `${baseMessage} lowercase letter`,
      helpers.regex(/(?=.[a-z])/),
    ),
    includeUppercase: helpers.withMessage(
      `${baseMessage} uppercase letter`,
      helpers.regex(/(?=.[A-Z])/),
    ),
    includeSpecial: helpers.withMessage(
      `${baseMessage} special character from !@#$%^&*()_+}{';'?>.<,`,
      helpers.regex(/(?=.[!@#$%^&*()_+}{';?>.<,])/),
    ),
  },
  password_confirm: {
    sameAs: sameAs(toRef(state, 'password')),
  },
}

const vuelidate = useVuelidate(rules, state)

function clear() {
  vuelidate.value.$reset()

  for (const [key, value] of Object.entries(initialState))
    state[key] = value
}

const loading = ref(false)
const showPassword = ref(false)

async function register() {
  if (showPassword.value)
    state.password_confirm = state.password

  if (!await vuelidate.value.$validate())
    return

  loading.value = true

  try {
    await store.client?.request(registerUser(state.email, state.password, {
      first_name: state.username,
    }))
    clear()
    toast.success('Account created', {
      description: 'Please check your email to confirm your account.',
    })
  }
  catch (error) {
    toastError(error)
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <v-card class="ma-2">
    <v-form @submit.prevent="register">
      <v-card-title>Create an account</v-card-title>

      <v-card-text>
        <v-alert
          class="mb-5"
          type="info"
          text="An account is only required to upload DDF Bundle on the store. You can download and use DDF Bundle without an account."
        />

        <v-text-field
          v-model="state.username"
          :error-messages="vuelidate.username.$errors.map(e => e.$message)"
          label="Username"
          required
          autocomplete="username"
          @blur="vuelidate.username.$touch"
          @input="vuelidate.username.$touch"
        />

        <v-text-field
          v-model="state.email"
          :error-messages="vuelidate.email.$errors.map(e => e.$message)"
          label="Email"
          required
          autocomplete="email"
          @blur="vuelidate.email.$touch"
          @input="vuelidate.email.$touch"
        />

        <v-text-field
          v-model="state.password"
          :counter="10"
          :error-messages="vuelidate.password.$errors.map(e => e.$message)"
          label="Password"
          required
          :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="new-password"
          @click:append="showPassword = !showPassword; state.password_confirm = state.password"
          @blur="vuelidate.password.$touch"
          @input="vuelidate.password.$touch"
        />

        <v-expand-transition>
          <v-text-field
            v-show="!showPassword"
            v-model="state.password_confirm"
            :counter="10"
            :error-messages="vuelidate.password_confirm.$errors.map(e => e.$message)"
            label="Password confirmation"
            required
            type="password"
            autocomplete="new-password"
            @blur="vuelidate.password_confirm.$touch"
            @input="vuelidate.password_confirm.$touch"
          />
        </v-expand-transition>
      </v-card-text>
      <v-card-actions>
        <v-btn
          color="secondary"
          variant="tonal"
          append-icon="mdi-trash-can"
          @click="clear"
        >
          clear
        </v-btn>
        <v-btn
          :loading="loading"
          variant="tonal"
          color="primary"
          append-icon="mdi-account-plus"
          text="Register"
          type="submit"
        />
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<route lang="json">
{
    "meta": {
        "requiresAuth": false,
        "hideLevelTwoSidebar": true
    }
}
</route>
