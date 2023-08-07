import type { ZodiosPlugin } from '@zodios/core'

export function pluginAuth(getApiKey: () => string): ZodiosPlugin {
  return {
    name: 'pluginAuth',
    request: async (_endpoint, config) => {
      return {
        ...config,
        params: {
          ...config.params,
          apiKey: getApiKey(),
        },
      }
    },
  }
}

export function pluginTransformResponse(): ZodiosPlugin {
  return {
    name: 'pluginPatchResponse',
    response: async (_api, _config, response) => {
      if (response.data === '' && response.status === 200)
        response.data = { success: true }
      return response
    },
  }
}
