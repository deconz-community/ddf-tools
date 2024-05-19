<script setup lang="ts">
import semver from 'semver'

const route = useRoute()

const showLevelTowSidebar = computed(() => route.meta.hideLevelTwoSidebar !== true)

const gatewayId = computed(() => {
  return typeof route.params.gateway === 'string'
    ? route.params.gateway
    : undefined
})

const gateway = useGateway(gatewayId)

const haveRequiredAPI = computed(() => {
  const config = gateway.config
  return typeof route.meta.requireAPI === 'undefined'
    || (
      typeof route.meta.requireAPI === 'string'
      && config
      && semver.satisfies(config?.apiversion, route.meta.requireAPI)
    )
})
</script>

<template>
  <template v-if="gateway.state === undefined">
    <v-main class="d-flex align-center justify-center">
      <v-card>
        <v-card-title>
          No gateway found
        </v-card-title>
        <v-card-text>
          <v-alert type="error" class="ma-2" max-width="500">
            No gateway found with the ID {{ route.params.gateway }}.
            <br>
            Please check the gateway configuration.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :to="{ path: '/gateway' }" class="ma-2" variant="tonal">
            Open settings
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-main>
  </template>
  <template v-else-if="!gateway.state.matches('online')">
    <v-main class="d-flex align-center justify-center">
      <CardGateway
        v-if="gatewayId"
        :id="gatewayId"
        hide-remove-button
        class="ma-2 flex-fill"
        min-width="300"
        max-width="500"
        min-height="250"
      />
    </v-main>
  </template>

  <template v-else-if="gateway.state.matches('online')">
    <v-navigation-drawer v-model="showLevelTowSidebar" width="240" permanent>
      <nav-sidebar-level-two-gateway />
    </v-navigation-drawer>

    <portal-target name="before-content" />
    <v-main v-if="!haveRequiredAPI" class="d-flex align-center justify-center">
      <v-card>
        <v-card-title>
          Invalid Gateway version
        </v-card-title>
        <v-card-text>
          <v-alert type="error" class="ma-2" max-width="500">
            This feature requires a gateway with API version {{ route.meta.requireAPI }}.
            Your gateway is running version {{ gateway.config?.apiversion }}.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :to="{ path: '/gateway' }" class="ma-2" variant="tonal">
            Open settings
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-main>
    <v-main v-else>
      <router-view />
    </v-main>
  </template>

  <template v-else />
</template>
