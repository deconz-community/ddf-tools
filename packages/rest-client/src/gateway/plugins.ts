import type { ZodiosPlugin } from '@zodios/core'

export function pluginAuth(getApiKey: () => string): ZodiosPlugin {
  return {
    name: 'pluginAuth',
    request: async (_endpoint, config) => {
      return {
        ...config,
        params: {
          apiKey: getApiKey(),
          ...config.params,
        },
      }
    },
  }
}

export function pluginTransformResponse(): ZodiosPlugin {
  return {
    name: 'pluginPatchResponse',
    response: async (_api, config, response) => {
      // console.log({ _api, config, response })

      if (response.data === '') {
        switch (response.status) {
          case 200: {
            response.data = true
            break
          }
          case 404: {
            response.data = [{
              error: {
                address: config.url,
                description: 'Not found',
                type: 3,
              },
            }]

            break
          }
        }
      }

      if (response.status === 200) {
        switch (config.method) {
          case 'get' : {
            response.data = {
              success: response.data,
            }
          }
        }
      }

      if (!Array.isArray(response.data))
        response.data = [response.data]

      if (typeof response.headers.set === 'function')
        response.headers.set('Content-Type', 'application/json')
      else
        response.headers['content-type'] = 'application/json'

      // console.log('Plugin response', response)
      return response
    },
  }
}
