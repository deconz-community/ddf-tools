<script setup lang="ts">

</script>

<template>
  <v-app-bar
    color="teal-darken-4"
    image="https://picsum.photos/1920/1080?random"
  >
    <template #image>
      <v-img
        gradient="to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)"
      />
    </template>

    <v-app-bar-title>Deconz Toolbox</v-app-bar-title>

    <template #append>
      <btn-login />
    </template>
  </v-app-bar>
</template>
