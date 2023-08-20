import { defineStore } from 'pinia'
import { objectEntries } from 'ts-extras'
import { v4 as uuidv4 } from 'uuid'
import type { Raw } from 'vue'
import { useGateway } from '~/composables/useGateway'
import type { GatewayCredentials } from '~/interfaces/deconz'

export type StoredGateway = Raw<ReturnType<typeof useGateway>>

export const useGatewaysStore = defineStore('gateways', () => {
  const route = useRoute()

  const credentials = reactive<Record<string, GatewayCredentials>>({})
  const gateways = shallowReactive<Record<string, StoredGateway>>({})

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
        console.log('Creating gateway', uuid)
        const credentialsRef = toRef(credentials, uuid)
        gateways[uuid] = markRaw(useGateway(credentialsRef))
      })

    gatewayList
      .filter(uuid => !credentialsList.includes(uuid))
      .forEach((uuid) => {
        gateways[uuid].destroy()
        delete gateways[uuid]
      })
  })

  const getGateway = (uuid: string, timeout = 1000) => new Promise<StoredGateway | undefined>((resolve) => {
    const store = useGatewaysStore()

    const findGateway = () => {
      const gateway = store.gateways[uuid]
      if (gateway) {
        resolve(gateway)
        return true
      }
      return false
    }

    if (findGateway())
      return

    const watcher = store.$subscribe(() => {
      if (findGateway())
        watcher()
    })

    setTimeout(() => resolve(undefined), timeout)
  })

  return { credentials, gateways, addCredentials, removeCredentials, getGateway }
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
