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
  <v-card v-if="gateway.state.value" class="ma-3">
    <v-card-item>
      <v-card-title>
        {{ name }}
        <v-chip v-if="version" class="ml-2">
          {{ version }}
        </v-chip>
        <chip-gateway-state :state="gateway.state" class="ma-2" />
        <v-chip v-if="isNew" class="ml-2" color="success">
          New
        </v-chip>
      </v-card-title>
      <v-card-subtitle>{{ props.id }}</v-card-subtitle>
      <v-card-text>
        <pre>{{ gateway.state.value.value }}</pre>
        <template v-if="gateway.state.value.matches('offline')">
          <template v-if="gateway.state.value.matches('offline.error.invalid API key')">
            Oh noooo
          </template>
        </template>
        <!--
        <pre>{{ gateway.state.value?.context }}</pre>
        <pre>{{ gateway.state.value.value }}</pre>
        -->
      </v-card-text>
      <v-card-actions>
        <v-btn v-if="isNew" elevation="2" @click="addGateway()">
          Add
        </v-btn>
        <v-btn v-else elevation="2" @click="removeGateway()">
          Remove
        </v-btn>
        <btn-event elevation="2" :machine="gateway" event="Edit credentials" />
      </v-card-actions>
    </v-card-item>
  </v-card>
</template>
