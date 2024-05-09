import { z } from 'zod'

export function discoveryClient() {
  /*
  const client = new Zodios('https://phoscon.de', [{
    method: 'get',
    path: '/discover',
    response: z.array(
      z.object({
        id: z.string(),
        internalipaddress: z.string().ip(),
        macaddress: z.string(),
        internalport: z.number(),
        name: z.string(),
        publicipaddress: z.string().ip(),
      }),
    ),
    alias: 'discover',
    description: 'Get discovered gateways from Phoscon API',
  }], {
    axiosConfig: {
      timeout: 5000,
      ...axiosConfig,
    },
  })
  */

  return {}
}

/*
export function findGateway(URIs: string[], apiKey = '', expectedBridgeID = ''): Promise<FindGatewayResult> {
  return new Promise((resolve) => {
    let resolved = false

    const queries = URIs.map(async (uri) => {
      try {
        const gateway = gatewayClient(uri, apiKey)
        const config = await gateway.getConfig()

        if (!config.success)
          throw new Error('No response from the gateway')

        const info: GatewayInfo = {
          gateway,
          uri,
          apiKey,
          bridgeID: config.success.bridgeid,
        }

        if (expectedBridgeID.length > 0 && config.success.bridgeid !== expectedBridgeID) {
          // Return error now but will be returned later in Ok state
          return Err({
            code: 'bridge_id_mismatch',
            message: 'Bridge ID mismatch',
            ...info,
            priority: 20,
          } as const)
        }

        if (!('whitelist' in config.success)) {
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
          config: config.success,
          ...info,
        }))
        return undefined
      }
      catch (e) {
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
*/
