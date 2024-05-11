<script setup lang="ts">
import hmacSHA256 from 'crypto-js/hmac-sha256'

const installCode = ref<string>(import.meta.env.VITE_INSTALL_CODE)
const challenge = ref<string>('')
const challengeResult = computed(() => {
  if (challenge.value.length !== 64 || installCode.value.length !== 16)
    return ''
  return hmacSHA256(challenge.value, installCode.value.toLowerCase())
})
</script>

<template>
  <v-card width="100%" class="ma-2">
    <v-card-title>
      Authentication Challenge
    </v-card-title>
    <v-card-text>
      <v-text-field v-model="installCode" label="Install code" />
      <v-text-field v-model="challenge" label="Challenge" />
      <v-text-field v-model="challengeResult" readonly label="Challenge result" />
    </v-card-text>
  </v-card>
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": true
  }
}
</route>
