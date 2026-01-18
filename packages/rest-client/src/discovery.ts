import type { Result } from 'ts-results-es'
import type { ExtractResponseSchemaForAlias } from './core/helpers'
import type { GatewayClient } from './gateway'
import { Err, Ok } from 'ts-results-es'
import { gatewayClient } from './gateway'

interface GatewayInfo {
  gateway: GatewayClient
  uri: string
  apiKey: string
  bridgeID: string
}

export type FindGatewayResult = Result<
  (
    {
      code: 'ok'
      config: ExtractResponseSchemaForAlias<'getConfig'>
    }
    | {
      code: 'bridge_id_mismatch' | 'invalid_api_key'
      message: string
    }
  ) & GatewayInfo,
  {
    code: 'unreachable' | 'unknown'
    message?: string
  } & Partial<Pick<GatewayInfo, 'uri' | 'apiKey'>>
>

export function findGateway(URIs: string[], apiKey = '', expectedBridgeID = ''): Promise<FindGatewayResult> {
  return new Promise((resolve) => {
    let resolved = false

    const queries = URIs.map(async (uri) => {
      try {
        const gateway = gatewayClient({
          address: uri,
          apiKey,
        })
        const results = await gateway.request('getConfig', {})
        const config = results.find(result => result.isOk())

        if (config === undefined || !config.isOk())
          throw new Error('No response from the gateway')

        const info: GatewayInfo = {
          gateway,
          uri,
          apiKey,
          bridgeID: config.value.bridgeid,
        }

        if (expectedBridgeID.length > 0 && config.value.bridgeid !== expectedBridgeID) {
          // Return error now but will be returned later in Ok state
          return Err({
            code: 'bridge_id_mismatch',
            message: 'Bridge ID mismatch',
            ...info,
            priority: 20,
          } as const)
        }

        if (config.value.authenticated === false) {
          // Return error now but will be returned later in Ok state
          return Err({
            code: 'invalid_api_key',
            message: 'Invalid API key',
            ...info,
            priority: 30,
          } as const)
        }

        resolved = true
        resolve(Ok({
          code: 'ok',
          config: config.value,
          ...info,
        }))
        return undefined
      }
      catch {
        return Err({
          code: 'unreachable',
          message: 'No response from the gateway',
          uri,
          apiKey,
          priority: 10,
        } as const)
      }
    })

    Promise.allSettled(queries).then((queriesResult) => {
      if (resolved)
        return

      const result = queriesResult
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

      if (result === undefined) {
        return resolve(Err({
          code: 'unreachable',
          message: 'No response from the gateway',
        } as const))
      }

      if (result.isErr()) {
        const data = result.unwrapErr()
        if (data.code === 'invalid_api_key' || data.code === 'bridge_id_mismatch') {
          return resolve(Ok({
            code: data.code,
            message: data.message,
            gateway: data.gateway,
            uri: data.uri,
            apiKey: data.apiKey,
            bridgeID: data.bridgeID,
          }))
        }
        return resolve(Err({
          code: data.code,
          message: data.message,
          uri: data.uri,
          apiKey: data.apiKey,
        }))
      }
    })
  })
}
