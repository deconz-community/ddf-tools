<script setup lang="ts">
const route = useRoute()

const showLevelTowSidebar = computed(() => route.meta.hideLevelTwoSidebar !== true)
</script>

<template>
  <v-navigation-drawer v-model="showLevelTowSidebar" width="240" permanent>
    <nav-sidebar-level-two-gateway />
  </v-navigation-drawer>

  <!--
    <nav-topbar-details />
    -->

  <portal-target name="before-content" />
  <v-main>
    <router-view />
  </v-main>
</template>
