import { acceptHMRUpdate, defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  const navigationTitle = 'Home'

  const isGatewayRoute = computed(() => useRoute().params.gateway !== undefined)

  return {
    navigationTitle, isGatewayRoute,
  }
})

// https://pinia.vuejs.org/cookbook/hot-module-replacement.html
if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useAppStore, import.meta.hot))
