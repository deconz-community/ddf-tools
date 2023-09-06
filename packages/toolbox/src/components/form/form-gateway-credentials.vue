<script setup lang="ts">
import type { BodyParams } from '@deconz-community/rest-client'
import { FindGateway } from '@deconz-community/rest-client'
import hmacSHA256 from 'crypto-js/hmac-sha256'
import type { UseAppMachine } from '~/composables/useAppMachine'

const props = defineProps<{
  gateway: UseAppMachine<'gateway'>
}>()

const { state, send } = props.gateway
const installCode = ref<string>(import.meta.env.VITE_GATEWAY_INSTALL_CODE)

/*
const canConnect = computed(() => state.value?.can('Connect'))
const cantPrevious = computed(() => !state.can('Previous'))
const cantNext = computed(() => !state.can('Next'))
*/

async function fetchKey() {
  const result = await FindGateway(credentials.value.URIs.api, credentials.value.apiKey, credentials.value.id)

  if (result.isErr()) {
    console.error(result.error)
    return result
  }

  const gateway = result.unwrap().gateway

  const params: BodyParams<'createAPIKey'> = {
    devicetype: '@deconz-community/toolbox',
  }

  if (installCode.value.length > 0) {
    const challenge = await gateway.createChallenge()

    if (!challenge.success) {
      console.error(challenge.errors)
      return challenge
    }

    params['hmac-sha256'] = hmacSHA256(challenge.success, installCode.value.toLowerCase()).toString()
  }

  const apiKey = await gateway.createAPIKey(params)

  if (!apiKey.success) {
    console.error(apiKey.errors)
    return apiKey
  }
  credentials.value.apiKey = apiKey.success
}
</script>

<template>
  FORM
  <!--
  <v-card class="ma-2" elevation="1" variant="outlined">
    <template #title>
      Editing credentials
    </template>
    <template v-if="gateway.state.value!.matches('offline.editing.Address')">
      <v-btn @click="credentials.URIs.api.push('')">
        Add
      </v-btn>
      <template v-for="address, index of credentials.URIs.api" :key="index">
        <v-text-field
          v-model="credentials.URIs.api[index]"
          append-inner-icon="mdi-close"
          @click:append-inner="credentials.URIs.api.splice(index, 1)"
        />
      </template>
    </template>
    <template v-else-if="gateway.state.value!.matches('offline.editing.API key')">
      <v-text-field v-model="credentials.apiKey" label="API Key" />
      <v-text-field v-model="installCode" label="Install code" />
      <v-btn @click="fetchKey()">
        Fetch API key
      </v-btn>
    </template>

    <v-card-actions>
      <v-btn :disabled="cantPrevious" @click="machine.send('Previous')">
        Previous
      </v-btn>
      <v-btn :disabled="cantNext" @click="machine.send('Next')">
        Next
      </v-btn>
    </v-card-actions>
  </v-card>

  -->

  <!--
    <template v-if="props.credentials" #subtitle>
      <span>{{ props.credentials.id }}</span>
    </template>
    <v-form @submit.prevent="save">
      <v-card-text class="overflow-y-auto">
        <v-row dense>
          <!- Errors display ->
    <v-col v-show="error.length > 0" :cols="12">
      <v-alert type="error">
        {{ error }}
      </v-alert>
    </v-col>

    <v-col :cols="12">
      <v-text-field
        v-model="state.apiKey"
        label="API Key"
        required
        :error-messages="errorMessages(v.apiKey.$errors)"
        @input="v.apiKey.$touch()"
        @blur="v.apiKey.$touch()"
      />
    </v-col>

    <v-col :cols="12">
      <v-list>
        <template v-for="uriType in objectKeys(state.URIs)" :key="uriType">
          <v-list-subheader>{{ uriType }}</v-list-subheader>

          <v-list-item
            v-for="address, index of state.URIs[uriType]" :key="index"
            :value="address"
            :title="address"
          >
            <template #append>
              <v-icon icon="mdi-close" @click="removeAddress(uriType, index)" />
            </template>
          </v-list-item>
        </template>
      </v-list>
    </v-col>
    </v-row>

    <v-card-actions>
      <v-btn type="submit" color="success">
        Save
      </v-btn>
    </v-card-actions>
    </v-card-text>
    </v-form>
    -->
</template>
