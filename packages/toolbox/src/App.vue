<script setup lang="ts">
import { VSonner } from 'vuetify-sonner'
import 'vuetify-sonner/style.css'
</script>

<template>
  <v-app>
    <VSonner position="bottom-right" :visible-toasts="5" />
    <router-view />
  </v-app>
</template>
