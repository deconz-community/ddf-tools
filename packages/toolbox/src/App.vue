<script setup lang="ts">
import { VSonner } from '@neoncoder/vuetify-sonner'
import '@neoncoder/vuetify-sonner/style.css'
</script>

<template>
  <v-app>
    <VSonner position="bottom-right" :visible-toasts="5" />
    <router-view />
  </v-app>
</template>
