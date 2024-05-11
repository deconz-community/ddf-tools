<script setup lang="ts">
import type { ExtractParamsForAlias } from '@deconz-community/rest-client'
import { findGateway } from '@deconz-community/rest-client'
import hmacSHA256 from 'crypto-js/hmac-sha256'

const props = defineProps<{
  gateway: string
}>()

const gateway = useGateway(props.gateway)
const discovery = useAppMachine('discovery')

const installCode = ref<string>(import.meta.env.VITE_GATEWAY_INSTALL_CODE ?? '')

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

async function fetchKey() {
  if (!credentials.value)
    throw new Error('No credentials')

  const result = await findGateway(credentials.value.URIs.api, credentials.value.apiKey, credentials.value.id)

  if (result.isErr()) {
    console.error(result.error)
    return result
  }

  const gateway = result.unwrap().gateway

  const params: ExtractParamsForAlias<'createAPIKey'>['body'] = {
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

  gateway.send({
    type: 'UPDATE_CREDENTIALS',
    data: JSON.parse(JSON.stringify(credentials.value)),
  })
}

onScopeDispose(() => {
  if (gateway.state?.matches({ offline: 'disabled' }))
    gateway.send({ type: 'CONNECT' })
})

onMounted(async () => {
  // props.gateway.send({ type: 'NEXT' })
  // props.gateway.send({ type: 'NEXT' })
})

const isConnecting = computed(() => gateway.state?.matches('connecting'))
const isDisabled = computed(() => gateway.state?.matches({ offline: 'disabled' }))
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
  },
  {
    title: 'Websocket Address',
    subtitle: 'Optional',
  },
])

const currentStep = ref(1)

function disabled() {
  return currentStep.value === 1
    ? 'prev'
    : currentStep.value === steps.value.length
      ? 'next'
      : undefined
}
</script>

<template>
  <v-card>
    <v-card-title>
      {{ gateway.config?.name ?? `Gateway ${props.gateway}` }}
      <chip-gateway-state :gateway="gateway" class="ml-2" />

      <v-btn variant="elevated" color="secondary" class="ma-2" @click="save()">
        Save settings
      </v-btn>
    </v-card-title>

    <v-card-text>
      <v-stepper v-if="gateway" v-model="currentStep" alt-labels>
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
              <v-card-subtitle>
                Add manually an api Key or fetch it from the gateway using the
                install code or by pressing the link button in phoscon.
              </v-card-subtitle>
              <v-card-text>
                <v-text-field v-model="credentials.apiKey" label="API Key" />
                <v-expansion-panels>
                  <v-expansion-panel title="Fetch a key by pressing the link button">
                    <v-expansion-panel-text>
                      <p>
                        Press the "Authenticate app button inside the advanced gateway settings in phoscon.
                        And then press the button below.
                      </p>
                      <v-btn color="primary" class="mt-2" @click="fetchKey()">
                        I pressed the authenticate app button
                      </v-btn>
                    </v-expansion-panel-text>
                  </v-expansion-panel>

                  <v-expansion-panel title="Fetch a key using the install code">
                    <v-expansion-panel-text>
                      <div class="d-flex">
                        <v-text-field
                          v-model="installCode"
                          label="Install code"
                          class="mr-2"
                          hint="The install code can be found on the conbee box or in the deconz GUI in the menu Plugins->REST API Plugin"
                        />

                        <v-btn color="primary" class="mt-2" @click="fetchKey()">
                          Fetch API key
                        </v-btn>
                      </div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>

                <!--
                <v-expansion-panels class="mt-2">
                  <v-expansion-panel title="Fetch a key using gateway password">
                    <v-expansion-panel-text>
                      TODO
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-card-text>
              -->
              </v-card-text>
            </v-stepper-window-item>
            <v-stepper-window-item :value="3">
              <v-card
                color="grey-lighten-5"
                height="200"
              />
            </v-stepper-window-item>
          </v-stepper-window>
        </template>
      </v-stepper>
    </v-card-text>
  </v-card>

<!--
  <template v-if="credentials && gateway.state">
    <v-card variant="outlined">
      <template v-if="gateway.state.matches({ offline: { editing: 'address' } })">
        <v-card-title>
          Editing API address
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
      <template v-else-if="gateway.state.matches({ offline: { editing: 'apiKey' } })">
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
      <v-card-actions v-if="gateway.state.matches({ offline: 'editing' })">
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
  -->
</template>
