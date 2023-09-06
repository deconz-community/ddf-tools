<script setup lang="ts">
import type { BodyParams } from '@deconz-community/rest-client'
import { FindGateway } from '@deconz-community/rest-client'
import { produce } from 'immer'
import hmacSHA256 from 'crypto-js/hmac-sha256'

const props = defineProps<{
  id: string
}>()

// console.log('Init component card-gateway', props.id)

const app = useAppMachine('app')
const gateway = useAppMachine('gateway', { id: props.id })
const discovery = useAppMachine('discovery')

const isNew = computed(() => gateway.state.value === undefined)

const name = computed(() =>
  gateway.state.value?.context.credentials.name
   ?? discovery.state.value?.context.results.get(props.id)?.name
   ?? 'Unknown gateway',
)

const version = computed(() =>
  gateway.state.value?.context.config?.swversion
   ?? discovery.state.value?.context.results.get(props.id)?.version,
)

const { cloned: credentials, sync: resetCredentials } = useCloned(
  computed(() => gateway.state.value?.context.credentials),
  { clone: value => produce(value, () => {}) },
)
const installCode = ref<string>(import.meta.env.VITE_GATEWAY_INSTALL_CODE ?? '')

function addGateway() {
  const credentials = discovery.state.value?.context.results.get(props.id)
  if (credentials) {
    app.send({
      type: 'Add gateway',
      credentials: {
        id: credentials.id,
        name: credentials.name,
        apiKey: '',
        URIs: {
          api: credentials.uri,
          websocket: [],
        },
      },
    })
  }
}

function removeGateway() {
  app.send({ type: 'Remove gateway', id: props.id })
}

async function fetchKey() {
  if (!credentials.value)
    return

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
  <v-card class="ma-3">
    <v-card-item>
      <v-card-title>
        {{ name }}
        <v-chip v-if="version" class="ml-2">
          {{ version }}
        </v-chip>
        <v-chip v-if="isNew" class="ml-2" color="success">
          New
        </v-chip>
        <chip-gateway-state v-else :state="gateway.state" class="ml-2" />
      </v-card-title>
      <v-card-subtitle>{{ props.id }}</v-card-subtitle>
      <v-card-text v-if="!isNew">
        <template v-if="gateway.state.value!.matches('online')">
          <v-alert type="success" title="Info">
            You are connected to the gateway.
          </v-alert>
          <json-viewer :value="Object.keys(gateway.state.value!.context.devices) ?? []" />
        </template>

        <template v-if="gateway.state.value!.matches('connecting')">
          <v-alert type="info" title="Info">
            Connecting to the gateway...
          </v-alert>
        </template>

        <template v-if="gateway.state.value!.matches('offline')">
          <template v-if="gateway.state.value!.matches('offline.error')">
            <v-alert type="error" title="Error while connecting to the gateway">
              <template v-if="gateway.state.value!.matches('offline.error.unreachable')">
                The gateway is unreachable.
              </template>
              <template v-else-if="gateway.state.value!.matches('offline.error.invalid API key')">
                The API key is invalid.
              </template>
              <template v-else>
                Something went wrong.
              </template>
            </v-alert>
          </template>

          <template v-else-if="gateway.state.value!.matches('offline.disabled')">
            <v-alert type="info" title="Info">
              The gateway is disabled.
              <v-btn v-if="gateway.state.value?.can('Connect')" @click="gateway.send('Connect')">
                Connect
              </v-btn>
            </v-alert>
          </template>

          <template v-if="gateway.state.value!.matches('offline.editing') && credentials">
            {{ credentials }}
            <template v-if="gateway.state.value!.matches('offline.editing.Address')">
              Editing address
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
              Editing API Key
              <v-text-field v-model="credentials.apiKey" label="API Key" />
              <v-text-field v-model="installCode" label="Install code" />
              <v-btn @click="fetchKey()">
                Fetch API key
              </v-btn>
            </template>
          </template>

          <!--
          <pre>{{ gateway.state.value!.value }}</pre>
          <template v-if="gateway.state.value!.matches('offline')">
            <template v-if="gateway.state.value!.matches('offline.error.invalid API key')">
              Oh noooo
            </template>
            <form-gateway-credentials v-if="gateway.state.value!.matches('offline.editing')" :machine="gateway" />
          </template>
        <pre>{{ gateway.state.value?.context }}</pre>
        <pre>{{ gateway.state.value.value }}</pre>
        -->
        </template>
      </v-card-text>

      <v-card-actions v-if="isNew">
        <v-btn elevation="2" @click="addGateway()">
          Add
        </v-btn>
      </v-card-actions>
      <v-card-actions v-else-if="gateway.state.value!.matches('offline.editing')">
        <v-btn
          elevation="2"
          :disabled="gateway.state.value!.can('Previous') !== true"
          @click="gateway.send('Previous')"
        >
          Previous
        </v-btn>
        <v-btn
          elevation="2"
          :disabled="gateway.state.value!.can('Next') !== true"
          @click="gateway.send('Next')"
        >
          Next
        </v-btn>
      </v-card-actions>
      <v-card-actions v-else>
        <v-btn elevation="2" @click="removeGateway()">
          Remove
        </v-btn>
        <btn-event elevation="2" :machine="gateway" event="Edit credentials" />
      </v-card-actions>
    </v-card-item>
  </v-card>
</template>
