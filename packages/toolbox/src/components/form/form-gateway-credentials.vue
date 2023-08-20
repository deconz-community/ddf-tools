<script setup lang="ts">
import { FindGateway } from '@deconz-community/rest-client'
import { useSelector } from '@xstate/vue'
import type { GatewayMachine } from '~/stores/gateway'

const props = defineProps<{
  gateway: GatewayMachine
}>()

const { state, credentials, machine } = props.gateway
const installCode = ref<string>(import.meta.env.VITE_GATEWAY_INSTALL_CODE)

const cantConnect = useSelector(machine, state => !state.can('Connect'))
const cantPrevious = useSelector(machine, state => !state.can('Previous'))
const cantNext = useSelector(machine, state => !state.can('Next'))

async function fetchKeyWithInstallCode() {
  const finding = await FindGateway(credentials.value.URIs.api, credentials.value.apiKey, credentials.value.id)

  if (finding.isErr())
    return console.error(finding.error)

  const gateway = finding.unwrap().gateway

  const challenge = await gateway.createChallenge()

  console.log(challenge)
}

/*
function errorMessages(errors: ErrorObject[]) {
  return errors.map(error => unref(error.$message))
}

const error = ref('')

const rules = {
  apiKey: {
    required,
  },
}

const state = reactive<{
  apiKey: string
  URIs: Record<string, string[]>
}>({
  apiKey: '',
  URIs: {},
})

const v = useVuelidate(rules, state)
*/
</script>

<template>
  <v-card>
    <template #title>
      <span>{{ credentials.name }}</span>
      <json-viewer :value="credentials" />
      <v-btn @click="machine.send('Edit credentials')">
        Edit Credentials
      </v-btn>
      <v-btn :disabled="cantConnect" @click="machine.send('Connect')">
        Connect
      </v-btn>
    </template>

    <template v-if="state.matches('online')">
      <v-alert type="success" title="Info">
        You are connected to the gateway.
      </v-alert>
    </template>

    <template v-if="state.matches('connecting')">
      <v-alert type="info" title="Info">
        Connecting to the gateway...
      </v-alert>
    </template>

    <template v-if="state.matches('offline')">
      <template v-if="state.matches('offline.error')">
        <v-alert type="error" title="Error while connecting to the gateway">
          <template v-if="state.matches('offline.error.unreachable')">
            The gateway is unreachable.
          </template>
          <template v-else-if="state.matches('offline.error.invalid API key')">
            The API key is invalid.
          </template>
          <template v-else>
            Something went wrong.
          </template>
        </v-alert>
      </template>

      <template v-else-if="state.matches('offline.disabled')">
        <v-alert type="info" title="Info">
          The gateway is disabled.
          <v-btn :disabled="cantConnect" @click="machine.send('Connect')">
            Connect
          </v-btn>
        </v-alert>
      </template>

      <template v-else-if="state.matches('offline.editing')">
        <v-card class="ma-2" elevation="1" variant="outlined">
          <template #title>
            Editing credentials
          </template>
          <template v-if="state.matches('offline.editing.Address')">
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
          <template v-else-if="state.matches('offline.editing.API key')">
            <v-text-field v-model="credentials.apiKey" label="API Key" />
            <v-text-field v-model="installCode" label="Install code" />
            <v-btn @click="fetchKeyWithInstallCode()">
              Fetch API key
            </v-btn>
          </template>
        </v-card>
      </template>
    </template>

    <v-card-actions>
      <v-btn :disabled="cantPrevious" @click="machine.send('Previous')">
        Previous
      </v-btn>
      <v-btn :disabled="cantNext" @click="machine.send('Next')">
        Next
      </v-btn>
    </v-card-actions>

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
  </v-card>
</template>
