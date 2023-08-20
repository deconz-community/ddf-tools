<template>
  <v-layout>
    <nav-topbar-global />
    <nav-sidebar-level-one />
    <nav-sidebar-level-two />
    <nav-topbar-details />
    <perfect-scrollbar>
      <v-main>
        <suspense>
          <router-view />
          <template #fallback>
            Loading page ...
          </template>
        </suspense>
      </v-main>
    </perfect-scrollbar>
  </v-layout>
</template>
