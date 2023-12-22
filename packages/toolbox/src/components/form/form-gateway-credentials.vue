<script setup lang="ts">
import type { BodyParams } from '@deconz-community/rest-client'
import { FindGateway } from '@deconz-community/rest-client'
import hmacSHA256 from 'crypto-js/hmac-sha256'
import type { UseAppMachine } from '~/composables/useAppMachine'

const props = defineProps<{
  gateway: UseAppMachine<'gateway'>
}>()

const installCode = ref<string>(import.meta.env.VITE_GATEWAY_INSTALL_CODE ?? '')

const { cloned: credentials, sync: resetCredentials } = useCloned(
  computed(() => props.gateway.state?.context.credentials),
  { clone: structuredClone },
)

/*
const canConnect = computed(() => state.value?.can({type:'CONNECT'}))
const cantPrevious = computed(() => !state.can({type:'PREVIOUS'}))
const cantNext = computed(() => !state.can({type:'NEXT'}))
*/

async function fetchKey() {
  if (!credentials.value)
    throw new Error('No credentials')

  const result = await FindGateway(credentials.value.URIs.api, credentials.value.apiKey, credentials.value.id)

  if (result.isErr()) {
    console.error(result.error)
    return result
  }

  const gateway = result.unwrap().gateway

  const params: BodyParams<'createAPIKey'> = {
    devicetype: '@deconz-community/toolbox',
  }

  if (installCode.value && installCode.value.length > 0) {
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

function save() {
  if (!credentials.value)
    throw new Error('No credentials')
  props.gateway.send({
    type: 'UPDATE_CREDENTIALS',
    data: JSON.parse(JSON.stringify(credentials.value)),
  })
}
</script>

<template>
  <template v-if="credentials && gateway.state">
    <v-card variant="outlined">
      <template v-if="gateway.state.matches('offline.editing.address')">
        <v-card-title>
          Editing address
        </v-card-title>
        <v-card-text>
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
        </v-card-text>
      </template>
      <template v-else-if="gateway.state.matches('offline.editing.apiKey')">
        <v-card-title>
          Editing API Key
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="credentials.apiKey" label="API Key" />
          <v-text-field v-model="installCode" label="Install code" />
          <v-btn @click="fetchKey()">
            Fetch API key
          </v-btn>
        </v-card-text>
      </template>
      <v-card-actions v-if="gateway.state.matches('offline.editing')">
        <v-btn
          elevation="2"
          :disabled="gateway.state.can({ type: 'PREVIOUS' }) !== true"
          @click="gateway.send({ type: 'PREVIOUS' })"
        >
          Previous
        </v-btn>
        <v-btn
          elevation="2"
          :disabled="gateway.state.can({ type: 'NEXT' }) !== true"
          @click="gateway.send({ type: 'NEXT' })"
        >
          Next
        </v-btn>
        <v-btn
          elevation="2"
          @click="save()"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </template>
</template>
