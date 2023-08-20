<template>
  <v-layout>
    <nav-topbar-global />
    <nav-sidebar-level-one />
    <nav-sidebar-level-two />
    <nav-topbar-details />
    <perfect-scrollbar>
      <v-main>
        <router-view />
      </v-main>
    </perfect-scrollbar>
  </v-layout>
</template>
