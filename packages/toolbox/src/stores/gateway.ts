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
    const credentialsList = Object.keys(credentials)
    const gatewayList = Object.keys(gateways)

    credentialsList
      .filter(uuid => !gatewayList.includes(uuid))
      .forEach((uuid) => {
        const credentialsRef = toRef(credentials, uuid)
        gateways[uuid] = useGateway(credentialsRef)
      })

    gatewayList
      .filter(uuid => !credentialsList.includes(uuid))
      .forEach((uuid) => {
        gateways[uuid].destroy()
        delete gateways[uuid]
      })
  })

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
