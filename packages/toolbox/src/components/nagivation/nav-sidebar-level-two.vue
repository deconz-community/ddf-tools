<script setup lang="ts">
const route = useRoute()

const drawer = computed(() => route.meta.hideLevelTwoSidebar !== true)

const App = useAppStore()
</script>

<template>
  <div>
    <v-navigation-drawer v-model="drawer" width="240" permanent>
      <v-toolbar height="48" :title="App.navigationTitle" />

      <portal-target name="sidebar-level-two">
        Portal taget
      </portal-target>

      <div v-if="App.isGatewayRoute">
        <spot-gateway-state />
      </div>
      <v-list id="#nav-level-two-list">
        <nav-sidebar-level-two-gateway v-if="App.isGatewayRoute" />
        <!--
        <v-list-item>
          <v-list-item-title># Settings</v-list-item-title>
        </v-list-item>
        -->
      </v-list>
    </v-navigation-drawer>
  </div>
</template>
