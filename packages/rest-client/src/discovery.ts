import { Zodios } from '@zodios/core'
import type { AxiosRequestConfig } from 'axios'
import { z } from 'zod'

export function Discovery(axiosConfig: AxiosRequestConfig = {}) {
  const client = new Zodios('https://phoscon.de',
    [{
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
    }],
    {
      axiosConfig,
    },
  )

  return client
}
