<script setup lang="ts">
import hmacSHA256 from 'crypto-js/hmac-sha256'

const installCode = ref<string>(import.meta.env.VITE_GATEWAY_INSTALL_CODE)
const challenge = ref<string>('')
const challengeResult = computed(() => {
  if (challenge.value.length !== 64 || installCode.value.length !== 16)
    return ''
  return hmacSHA256(challenge.value, installCode.value.toLowerCase())
})
</script>

<template>
  <v-card>
    <v-card-title>
      Authentication Challenge
    </v-card-title>
    <v-card-text class="d-flex">
      <v-text-field
        v-model="installCode"
        label="Install code"
        class="mr-2"
        hint="The install code can be found on the conbee box or in the deconz GUI in the menu Plugins->REST API Plugin"
      />
      <v-text-field
        v-model="challenge"
        label="Challenge"
        class="mr-2"
        hint="Value from the challenge response of the `createChallenge` API call."
      />
      <v-text-field
        v-model="challengeResult"
        readonly
        disabled
        label="Challenge result"
      />
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
