<script setup lang="ts">
import { VSonner } from 'vuetify-sonner'
</script>

<template>
  <v-app>
    <VSonner expand position="top-right" :visible-toasts="9" />
    <router-view />
  </v-app>
</template>
