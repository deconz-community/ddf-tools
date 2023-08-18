import { defineStore } from 'pinia'
import { objectEntries } from 'ts-extras'
import { v4 as uuidv4 } from 'uuid'
import { useGateway } from '~/composables/useGateway'
import type { GatewayCredentials } from '~/interfaces/deconz'

export const useGatewaysStore = defineStore('gateways', () => {
  const route = useRoute()

  const credentials = shallowReactive<Record<string, GatewayCredentials>>({})
  const gateways = shallowReactive<Record<string, ReturnType<typeof useGateway>>>({})

  const addCredentials = (newCredentials: GatewayCredentials) => {
    credentials[uuidv4()] = newCredentials
  }

  const removeCredentials = (gatewayID: string) => {
    objectEntries(credentials).forEach(([uuid, data]) => {
      if (data.id === gatewayID)
        delete credentials[uuid]
    })
  }

  // Sync gateway data with credentials
  watch(credentials, () => {
    // Check for new credentials
    objectKeys(credentials).forEach((id) => {
      if (gateways[id] === undefined) {
        const credentialsRef = toRef(credentials, id)
        gateways[id] = useGateway(credentialsRef)
      }
    })

    // Check for deleted credentials
    objectKeys(gateways).forEach((id) => {
      if (credentials[id] === undefined) {
        gateways[id].destroy()
        delete gateways[id]
      }
    })
  }, { deep: true })

  return { credentials, gateways, addCredentials, removeCredentials }
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
