<script setup lang="ts">
const route = useRoute()

const isGatewayRoute = computed(() => route.params.gateway !== undefined)
</script>

<template>
  <v-toolbar height="48" title="-->Titre<--" />

  <portal-target name="sidebar-level-two">
    Portal taget
  </portal-target>

  <v-list id="#nav-level-two-list">
    <nav-sidebar-level-two-gateway v-if="isGatewayRoute" />
    <v-list-item>
      <v-list-item-title># Settings</v-list-item-title>
    </v-list-item>
  </v-list>
</template>
