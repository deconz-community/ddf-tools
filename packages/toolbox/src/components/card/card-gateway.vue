<script setup lang="ts">
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

const devices = computed(() => Object.keys(gateway.state.value?.context.devices ?? []))

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
</script>

<template>
  <v-card class="ma-3">
    <v-card-item>
      <v-card-title>
        {{ name }}
        <v-chip v-if="version" class="ml-2">
          {{ version }}
        </v-chip>
        <v-chip v-if="isNew" class="ml-2" color="info">
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
          <pre>{{ devices }}</pre>
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

          <template v-if="gateway.state.value!.matches('offline.editing')">
            <form-gateway-credentials :gateway="gateway" />
          </template>
        </template>
      </v-card-text>

      <v-card-actions v-if="isNew">
        <v-btn elevation="2" @click="addGateway()">
          Add
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
