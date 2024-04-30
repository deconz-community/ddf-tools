<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router'
import { reactive } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { helpers, minLength, required, sameAs } from '@vuelidate/validators'
import { passwordReset } from '@directus/sdk'
import { toastError } from '~/lib/handleError'

const store = useStore()

const queryToken = useRouteQuery('token', '')
const data = computed(() => {
  if (queryToken.value.length === 0)
    return undefined
  const [type, token] = queryToken.value.split('.')

  return {
    type: JSON.parse(atob(type)),
    token: JSON.parse(atob(token)),
  }
})

const email = computed(() => data.value?.token.email ?? '')

const initialState = {
  password: '',
  password_confirm: '',
}

const state = reactive({
  ...initialState,
})

const baseMessage = 'Password must contain at least one'

const rules = {
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
      helpers.regex(/(?=.[!@#$%^&*()_+}{';'?>.<,])/),
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

async function updatePassword() {
  if (showPassword.value)
    state.password_confirm = state.password

  if (!await vuelidate.value.$validate())
    return

  loading.value = true

  try {
    await store.client?.request(passwordReset(
      queryToken.value,
      state.password,
    ))
    store.send({ type: 'LOGIN_WITH_PASSWORD', email: email.value, password: state.password })
    toast.success('Password updated')
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
    <v-card-title>
      Reset password
    </v-card-title>
    <v-card-text>
      <v-form @submit.prevent="updatePassword">
        <v-text-field
          v-model="email"
          label="Email"
          autocomplete="username"
          readonly
          disabled
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

        <v-btn @click="clear">
          clear
        </v-btn>
        <v-btn
          :loading="loading"
          text="Submit"
          type="submit"
        />
      </v-form>
    </v-card-text>
  </v-card>
</template>

<route lang="json">
{
    "meta": {
    "breadcrumbs": "none",
    "hideLevelTwoSidebar": true
    }
}
</route>
