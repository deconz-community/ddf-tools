<script setup lang="ts">
const props = defineProps<{
  id: string
  hideRemoveButton?: boolean
}>()

const machines = createUseAppMachine()
const app = machines.use('app')
const gateway = machines.use('gateway', { id: props.id })
const discovery = machines.use('discovery')
const editDialog = ref(false)

const isNew = computed(() => gateway.state === undefined)

const name = computed(() =>
  gateway.state?.context.credentials.name
  ?? discovery.state?.context.results.get(props.id)?.name
  ?? 'Unknown gateway',
)

const version = computed(() =>
  gateway.state?.context.config?.swversion
  ?? discovery.state?.context.results.get(props.id)?.version,
)

function addGateway() {
  const credentials = discovery.state?.context.results.get(props.id)
  if (credentials) {
    app.send({
      type: 'ADD_GATEWAY',
      credentials: {
        id: credentials.id,
        name: credentials.name,
        apiKey: '',
        URIs: {
          api: credentials.uris,
          websocket: [],
        },
      },
    })
  }
}

function removeGateway() {
  app.send({ type: 'REMOVE_GATEWAY', id: props.id })
}

onMounted(async () => {
  await new Promise(resolve => setTimeout(resolve, 200))
  // gateway.send({ type: 'EDIT_CREDENTIALS' })
})
</script>

<template>
  <v-card class="d-flex flex-column">
    <v-card-title>
      {{ name }}
      <v-chip v-if="version" class="ml-2">
        {{ version }}
      </v-chip>
      <v-chip v-if="isNew" class="ml-2" color="info">
        New
      </v-chip>
      <chip-gateway-state v-else :gateway="gateway" class="ml-2" />
    </v-card-title>
    <v-card-subtitle>{{ props.id }}</v-card-subtitle>
    <v-card-text v-if="!isNew" class="flex-grow-1">
      <template v-if="gateway.state!.matches('online')">
        <v-alert type="success" title="Info">
          You are connected to the gateway.
        </v-alert>
        <!--
          <pre>{{ gateway.state?.context.credentials }}</pre>
          <pre>Devices count : {{ deviceCount }}</pre>
          -->
      </template>

      <template v-if="gateway.state!.matches('connecting') || gateway.state!.matches('init')">
        <v-alert type="info" title="Info">
          Connecting to the gateway...
        </v-alert>
      </template>

      <template v-if="gateway.state!.matches('offline')">
        <template v-if="gateway.state!.matches({ offline: 'error' })">
          <v-alert type="error" title="Error while connecting to the gateway">
            <template v-if="gateway.state!.matches({ offline: { error: 'unreachable' } })">
              The gateway is unreachable.
            </template>
            <template v-else-if="gateway.state!.matches({ offline: { error: 'invalidApiKey' } })">
              The API key is invalid.
            </template>
            <template v-else>
              Something went wrong.
            </template>
          </v-alert>
        </template>

        <template v-else-if="gateway.state!.matches({ offline: 'disabled' })">
          <v-alert type="info" title="Info">
            The gateway is disabled.
            <v-btn v-if="gateway.state!.can({ type: 'CONNECT' })" @click="gateway.send({ type: 'CONNECT' })">
              Connect
            </v-btn>
          </v-alert>
        </template>
      </template>
    </v-card-text>

    <v-card-text v-else class="flex-grow-1">
      <v-alert type="info" title="Info">
        This gateway is not yet added to the system.
      </v-alert>
    </v-card-text>

    <v-card-actions v-if="isNew">
      <v-btn
        elevation="2"
        color="success"
        variant="flat"
        append-icon="mdi-plus"
        @click="addGateway()"
      >
        Add
      </v-btn>
    </v-card-actions>
    <v-card-actions v-else>
      <v-btn
        v-if="!props.hideRemoveButton"
        elevation="2"
        append-icon="mdi-delete"
        color="error"
        variant="flat"
        @click="removeGateway()"
      >
        Remove
      </v-btn>

      <v-dialog v-model="editDialog" min-width="500" max-width="600">
        <template #activator="{ props: activatorProps }">
          <v-btn
            v-bind="activatorProps"
            elevation="2"
            append-icon="mdi-pencil"
            color="secondary"
            variant="flat"
          >
            Edit credentials
          </v-btn>
        </template>

        <template #default>
          <form-gateway-credentials
            :gateway="props.id"
            @close="editDialog = false"
          />
        </template>
      </v-dialog>
    </v-card-actions>
  </v-card>
</template>
