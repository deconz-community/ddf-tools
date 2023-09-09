<script setup lang="ts">
const App = useAppStore()

const route = useRoute()
const gateway = useAppMachine('gateway', computed(() => ({ id: route.params.gateway as string })))
</script>

<template>
  <div>
    {{ gateway.state?.context.credentials.name }}
    <!-- WIP
    <v-tooltip
      :text="Gateway.activeGateway.pooling.state.messages.value"
      :disabled="Gateway.activeGateway.pooling.state.isOK.value"
      location="bottom"
    >
      <template #activator="{ props }">
        <v-chip
          class="ma-2"
          label
          v-bind="{ ...props }"
          :color="Gateway.activeGateway.pooling.state.color.value"
        >
          <v-icon start icon="mdi-api" />
          {{ Gateway.activeGateway.pooling.state.state }}
        </v-chip>
      </template>
    </v-tooltip>

    <v-tooltip
      :text="Gateway.activeGateway.websocket.state.messages.value"
      :disabled="Gateway.activeGateway.websocket.state.isOK.value"
      location="bottom"
    >
      <template #activator="{ props }">
        <v-chip
          class="ma-2"
          label
          v-bind="{ ...props }"
          :color="Gateway.activeGateway.websocket.state.color.value"
        >
          <v-icon start icon="mdi-link-variant" />
          {{ Gateway.activeGateway.websocket.state.state }}
        </v-chip>
      </template>
    </v-tooltip>
    -->
  </div>
</template>
