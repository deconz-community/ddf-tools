import { Zodios } from '@zodios/core'
import { configEndpoints } from './endpoints/configEndpoints'
import { alarmSystemsEndpoints } from './endpoints/alarmSystemsEndpoints'
import { pluginAuth, pluginTransformResponse } from './plugins'
import { groupsEndpoints } from './endpoints/groupsEndpoints'
import { lightsEndpoints } from './endpoints/lightsEndpoints'
import { sensorsEndpoints } from './endpoints/sensorsEndpoints'
import { devicesEndpoints } from './endpoints/devicesEndpoints'

export interface GatewayCredentials {
  address: string
  apiKey?: string
}

export function Gateway(address: string, apiKey: string) {
  const client = new Zodios(
    address,
    [
      ...configEndpoints,
      ...alarmSystemsEndpoints,
      ...devicesEndpoints,
      ...sensorsEndpoints,
      ...groupsEndpoints,
      ...lightsEndpoints,
    ],
    {
      axiosConfig: {
        validateStatus: () => true,
        headers: {
          Accept: 'application/vnd.ddel.v1.1', // Version recommended by Manup
        },
      },
    })

  client.use(pluginAuth(() => apiKey))
  client.use(pluginTransformResponse())

  const updateApiKey = (newApiKey: string) => apiKey = newApiKey

  return { client, updateApiKey }
}
