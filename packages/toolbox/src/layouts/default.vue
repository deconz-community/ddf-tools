<template>
  <v-layout>
    <nav-topbar-global />
    <nav-sidebar-level-one />
    <nav-topbar-details />

    <portal-target name="before-content" />
    <!--
    <perfect-scrollbar>
      -->
    <v-main>
      <suspense>
        <router-view />
        <template #fallback>
          Loading page ...
        </template>
      </suspense>
    </v-main>
    <!--
    </perfect-scrollbar>
    -->
  </v-layout>
</template>
