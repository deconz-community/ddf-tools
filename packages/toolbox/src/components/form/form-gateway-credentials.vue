<script setup lang="ts">
import type { ExtractParamsForAlias } from '@deconz-community/rest-client'
import { findGateway } from '@deconz-community/rest-client'
import hmacSHA256 from 'crypto-js/hmac-sha256'

const props = defineProps<{
  gateway: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const gateway = useGateway(props.gateway)

const installCode = ref<string>(import.meta.env.VITE_GATEWAY_INSTALL_CODE ?? '')
const gatewayPassword = ref<string>(import.meta.env.VITE_GATEWAY_PASSWORD ?? '')
const formPanel = ref('password')

const { cloned: credentials, sync: resetCredentials } = useCloned(
  computed(() => gateway.credentials ?? {
    id: '',
    name: '',
    apiKey: '',
    URIs: {
      api: [],
      websocket: [],
    },
  }),
  { clone: structuredClone },
)

async function fetchKey(method: 'link_button' | 'install_code' | 'password') {
  if (!credentials.value)
    throw new Error('No credentials')

  const result = await findGateway(credentials.value.URIs.api, credentials.value.apiKey, credentials.value.id)

  if (result.isErr()) {
    console.error(result.error)
    return result
  }

  const gateway = result.unwrap().gateway

  const params: ExtractParamsForAlias<'createAPIKey'> = {
    body: {
      devicetype: '@deconz-community/toolbox',

    },
  }

  switch (method) {
    case 'link_button':

      break
    case 'install_code':{
      if (!installCode.value || installCode.value.length === 0)
        return toast.error('No install code provided')

      const challenge = (await gateway.request('createChallenge', {})).shift()

      if (
        challenge === undefined
        || challenge.isErr()
        || challenge.value.challenge === undefined
      ) {
        toast.error('Failed to create challenge')
        console.error(challenge)
        return
      }

      params.body['hmac-sha256'] = hmacSHA256(
        challenge.value.challenge,
        installCode.value.toLowerCase(),
      ).toString()

      break
    }

    case 'password':{
      if (!gatewayPassword.value || gatewayPassword.value.length === 0)
        return toast.error('No gateway password provided')
      params.gatewayPassword = gatewayPassword.value
      break
    }
  }

  console.log(params)
  const apiKey = (await gateway.request('createAPIKey', params)).shift()

  if (
    apiKey === undefined
    || apiKey.isErr()
  ) {
    toast.error('Failed to create API Key')
    console.error(apiKey)
    return
  }

  credentials.value.apiKey = apiKey.value.username
}

function save() {
  if (!credentials.value)
    throw new Error('No credentials')

  gateway.send({
    type: 'UPDATE_CREDENTIALS',
    data: JSON.parse(JSON.stringify(credentials.value)),
  })
}

onScopeDispose(() => {
  if (gateway.state?.matches({ offline: 'disabled' }))
    gateway.send({ type: 'CONNECT' })
})

// const isConnecting = computed(() => gateway.state?.matches('connecting'))
// const isDisabled = computed(() => gateway.state?.matches({ offline: 'disabled' }))
const isUnreachable = computed(() => gateway.state?.matches({ offline: { error: 'unreachable' } }))
const isInvalidApiKey = computed(() => gateway.state?.matches({ offline: { error: 'invalidApiKey' } }))
const isOnline = computed(() => gateway.state?.matches('online'))

const steps = computed(() => [
  {
    title: 'Gateway Address',
    error: isUnreachable.value,
    complete: isOnline.value || isInvalidApiKey.value,
    color: (isOnline.value || isInvalidApiKey.value) ? 'success' : 'error',
  },
  {
    title: 'API Key',
    error: gateway.state?.matches({ offline: { error: 'invalidApiKey' } }),
    subtitle: gateway.state?.matches({ offline: { error: 'invalidApiKey' } })
      ? 'The API key is invalid.'
      : undefined,
    complete: isOnline.value,
    color: isOnline.value
      ? 'success'
      : isInvalidApiKey.value ? 'error' : '',
  },
  /*
  {
    title: 'Websocket Address',
    subtitle: 'Optional',
  },
  */
])

const currentStep = ref(1)
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-stretch">
      <div class="align-self-center me-auto">
        {{ gateway.config?.name ?? `Gateway ${props.gateway}` }}
        <chip-gateway-state :gateway="gateway" class="ml-2" />
      </div>
      <v-btn
        variant="elevated"
        color="secondary"
        class="ma-2 align-self-center "
        append-icon="mdi-floppy"
        @click="save()"
      >
        Save settings
      </v-btn>
      <v-btn
        variant="outlined"
        append-icon="mdi-close"
        class="ma-2 align-self-center"
        color="secondary"
        @click="emit('close')"
      >
        Close
      </v-btn>
    </v-card-title>

    <v-card-text>
      <v-stepper v-if="gateway" v-model="currentStep">
        <template #default>
          <v-stepper-header>
            <template v-for="n in steps.length" :key="`${n}-step`">
              <v-stepper-item
                step="Step {{ n }}"
                :value="n"
                v-bind="steps[n - 1]"
                editable
                @click="currentStep = n"
              />
              <v-divider
                v-if="n !== steps.length"
                :key="n"
              />
            </template>
          </v-stepper-header>

          <v-stepper-window>
            <v-stepper-window-item :value="1">
              <v-card>
                <v-card-title>
                  Gateway address
                  <v-btn
                    variant="elevated"
                    text="Add"
                    append-icon="mdi-plus"
                    @click="credentials.URIs.api.push('')"
                  />
                </v-card-title>
                <v-card-text>
                  <template v-for="address, index of credentials.URIs.api" :key="index">
                    <v-text-field
                      v-model="credentials.URIs.api[index]"
                      append-inner-icon="mdi-close"
                      @click:append-inner="credentials.URIs.api.splice(index, 1)"
                    />
                  </template>
                </v-card-text>

                <v-card-actions />
              </v-card>
            </v-stepper-window-item>

            <v-stepper-window-item :value="2">
              <v-card-title>
                Editing API Key
              </v-card-title>
              <v-card-subtitle class="text-wrap">
                Add manually an api Key or fetch it from the gateway using the
                install code or by pressing the link button in phoscon.
              </v-card-subtitle>
              <v-card-text>
                <v-text-field v-model="credentials.apiKey" label="API Key" />
                <v-expansion-panels v-model="formPanel">
                  <v-expansion-panel value="password" title="Fetch a key using gateway password">
                    <v-expansion-panel-text>
                      <div class="d-flex">
                        <v-text-field
                          v-model="gatewayPassword"
                          label="Gateway password"
                          type="password"
                          class="mr-2"
                          hint=""
                        />
                        <v-btn color="primary" class="mt-2" @click="fetchKey('password')">
                          Fetch API key
                        </v-btn>
                      </div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                  <v-expansion-panel value="link_button" title="Fetch a key by pressing the link button">
                    <v-expansion-panel-text>
                      <p>
                        Press the "Authenticate app button inside the advanced gateway settings in phoscon.
                        And then press the button below.
                      </p>
                      <v-btn color="primary" class="mt-2" @click="fetchKey('link_button')">
                        I pressed the authenticate app button
                      </v-btn>
                    </v-expansion-panel-text>
                  </v-expansion-panel>

                  <v-expansion-panel value="install_code" title="Fetch a key using the install code">
                    <v-expansion-panel-text>
                      <p>
                        The install code can be found on the conbee box or in the deconz GUI
                        in the menu Plugins->REST API Plugin.
                      </p>
                      <div class="d-flex">
                        <v-text-field
                          v-model="installCode"
                          label="Install code"
                          class="mr-2"
                        />
                        <v-btn color="primary" class="mt-2" @click="fetchKey('install_code')">
                          Fetch API key
                        </v-btn>
                      </div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-card-text>
            </v-stepper-window-item>
            <!--
            <v-stepper-window-item :value="3">
              <v-card
                color="grey-lighten-5"
                height="200"
              />
            </v-stepper-window-item>
            -->
          </v-stepper-window>
        </template>
      </v-stepper>
    </v-card-text>
  </v-card>
</template>
