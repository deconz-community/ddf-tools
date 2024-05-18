<script setup lang="ts">
import { VSonner } from 'vuetify-sonner'
import 'vuetify-sonner/style.css'
</script>

<template>
  <v-app>
    <v-layout>
      <nav-topbar-global />
      <nav-sidebar-level-one />

      <VSonner position="bottom-right" :visible-toasts="5" />
      <router-view />
    </v-layout>
  </v-app>
</template>
