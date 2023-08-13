import { defineStore } from 'pinia'
import { useGateway } from '~/composables/useGateway'
import type { GatewayCredentials } from '~/interfaces/deconz'

export const useGatewaysStore = defineStore('gateways', () => {
  const route = useRoute()

  const credentials = shallowReactive<Record<string, GatewayCredentials>>({})
  const gateways = shallowReactive<Record<string, ReturnType<typeof useGateway>>>({})

  // Sync gateway data with credentials
  watch(() => objectKeys(credentials).length, (currentValue, oldValue) => {
    if (oldValue < currentValue) {
      // Credentials was added
      objectKeys(credentials).forEach((id) => {
        if (!gateways[id])
          gateways[id] = useGateway(toRef(credentials, id))
      })
    }
    else {
      // Credentials was deleted
      objectKeys(gateways).forEach((id) => {
        if (credentials[id] === undefined) {
          gateways[id].destroy()
          delete gateways[id]
        }
      })
    }
  })

  const updateCredentials = (newCredentials: GatewayCredentials) => {
    credentials[newCredentials.id] = newCredentials
  }

  const removeCredentials = (gatewayID: string) => {
    delete credentials[gatewayID]
  }

  return { credentials, gateways, updateCredentials, removeCredentials }
}, {
  // https://github.com/prazdevs/pinia-plugin-persistedstate
  // For later : https://github.com/prazdevs/pinia-plugin-persistedstate/issues/60#issuecomment-1120244473
  persist: {
    paths: [
      'credentials',
    ],
  },

})

// https://pinia.vuejs.org/cookbook/hot-module-replacement.html
// if (import.meta.hot)
//  import.meta.hot.accept(acceptHMRUpdate(useGatewaysStore, import.meta.hot))
// Workaround for https://github.com/prazdevs/pinia-plugin-persistedstate/issues/79
// This will force a webpage refrech on edit
if (import.meta.hot)
  import.meta.hot.invalidate()
