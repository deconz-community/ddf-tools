<script setup lang="ts">
const route = useRoute()

const showLevelTowSidebar = computed(() => route.meta.hideLevelTwoSidebar !== true)
const isGatewayRoute = computed(() => route.params.gateway !== undefined)
</script>

<template>
  <v-layout>
    <nav-topbar-global />
    <nav-sidebar-level-one />

    <v-navigation-drawer v-model="showLevelTowSidebar" width="240" permanent>
      <nav-sidebar-level-two-gateway v-if="isGatewayRoute" />
      <nav-sidebar-level-two v-else />
    </v-navigation-drawer>

    <nav-topbar-details />

    <portal-target name="before-content" />
    <!--
    <perfect-scrollbar>
      -->
    <v-main>
      <router-view />
    </v-main>
    <!--
    </perfect-scrollbar>
    -->
  </v-layout>
</template>
