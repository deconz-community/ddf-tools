<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})
</script>

<template>
  <v-hover v-slot="{ isHovering, props }">
    <v-btn
      height="48"
      block
      variant="outlined"
      :rounded="isHovering ? 'rounded-xl' : 'circle'"
      v-bind="{ ...props, ...$attrs }"
    >
      <slot />
    </v-btn>
  </v-hover>
</template>

<style scoped>
  .v-btn{
    transition: all 0.1s ease-in-out;
    /* https://github.com/vuetifyjs/vuetify/issues/15626 */
    will-change: transform;
    aspect-ratio: 1;
  }
</style>
