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
      if (response.data === '' || (Array.isArray(response.data) && response.data.length === 0)) {
        switch (response.status) {
          case 200: {
            response.data = [{
              success: true,
            }]
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
          default: {
            response.data = {
              error: {
                address: config.url,
                description: 'Something went wrong',
                type: 7,
              },
            }

            break
          }
        }
      }
      else if (response.status === 200) {
        switch (config.method) {
          case 'get' : {
            response.data = [{
              success: response.data,
            }]
          }
        }
      }

      if (!Array.isArray(response.data))
        response.data = [response.data]

      if (typeof response.headers.set === 'function')
        response.headers.set('Content-Type', 'application/json')
      else
        response.headers['content-type'] = 'application/json'

      return response
    },
  }
}

export function pluginBlobResponse(): ZodiosPlugin {
  // From https://github.com/ecyrbe/zodios/issues/390#issuecomment-1479389725
  const exampleBlobResponse = [{ success: new Blob() }]

  return {
    name: 'pluginBlobResponse',
    request: async (api, config) => {
      const endpoint = api.find(e => e.method === config.method && e.path === config.url)

      if (!endpoint)
        return config

      // We have to guess whether the response schema is `z.instanceof(Blob)` because the info is not reflected
      let isLikelyInstanceOfBlob = false

      try {
        if (endpoint.response.safeParse(exampleBlobResponse).success)
          isLikelyInstanceOfBlob = true
      }
      catch (e) {}

      if (!isLikelyInstanceOfBlob)
        return config

      return {
        ...config,
        responseType: 'blob',
      }
    },
  }
}
