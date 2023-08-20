import { Zodios } from '@zodios/core'

import type { Result } from 'ts-results-es'
import { Err, Ok } from 'ts-results-es'
import { pluginAuth, pluginTransformResponse } from './plugins'
import { devicesEndpoints } from './endpoints/devicesEndpoints'
import { alarmSystemsEndpoints } from './endpoints/alarmSystemsEndpoints'
import { configEndpoints } from './endpoints/configEndpoints'
import { groupsEndpoints } from './endpoints/groupsEndpoints'
import { lightsEndpoints } from './endpoints/lightsEndpoints'
import { sensorsEndpoints } from './endpoints/sensorsEndpoints'

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

  return client
}

interface GatewayInfo {
  gateway: ReturnType<typeof Gateway>
  uri: string
  apiKey: string
  bridgeID: string
}

export type FindGatewayResult = Result<GatewayInfo,
(
  ({ type: 'bridge_id_mismatch' | 'invalid_api_key' } & GatewayInfo) |
  ({ type: 'unreachable' | 'unknown' } & Partial<Pick<GatewayInfo, 'uri' | 'apiKey'>>)
) & {
  message?: string
}>

export function FindGateway(URIs: string[], apiKey = '', expectedBridgeID = ''): Promise<FindGatewayResult> {
  return new Promise((resolve) => {
    let resolved = false

    const queries = URIs.map(async (uri) => {
      try {
        const gateway = Gateway(uri, apiKey)
        const config = await gateway.getConfig()

        if (!config.success)
          throw new Error('No response from the gateway')

        const info = {
          gateway,
          uri,
          apiKey,
          bridgeID: config.success.bridgeid,
        }

        if (expectedBridgeID.length > 0 && config.success.bridgeid !== expectedBridgeID) {
          // TODO Mixed result, I found one but it's not the one I was looking for
          return Err({
            type: 'bridge_id_mismatch',
            message: 'Bridge ID mismatch',
            ...info,
            priority: 20,
          } as const)
        }

        if (!('whitelist' in config.success)) {
          // TODO Mixed result, I found it but the key is invalid
          return Err({
            type: 'invalid_api_key',
            message: 'Invalid API key',
            ...info,
            priority: 30,
          } as const)
        }

        resolved = true
        resolve(Ok(info))
        return undefined
      }
      catch (e) {
        return Err({
          uri,
          apiKey,
          type: 'unreachable',
          message: 'No response from the gateway',
          priority: 10,
        } as const)
      }
    })

    Promise.allSettled(queries).then((queriesResult) => {
      if (resolved)
        return

      const error = queriesResult
        .map((result) => {
          if (result.status === 'fulfilled')
            return result.value
          return undefined
        })
        .filter(result => result !== undefined && result.isErr())
        .sort((a, b) => {
          return b!.unwrapErr().priority - a!.unwrapErr().priority
        })
        .shift()

      if (error)
        return resolve(error)

      return resolve(Err({
        type: 'unreachable',
        message: 'No response from the gateway',
      } as const))
    })
  })
}
