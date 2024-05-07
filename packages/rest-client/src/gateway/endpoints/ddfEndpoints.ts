import { z } from 'zod'
import { makeEndpoint } from '@zodios/core'
import { prepareResponse } from '../utils'
import { globalParameters } from '../parameters'
import { ddfdDescriptorSchema } from '../schemas/ddfSchema'

export const ddfEndpoints = [

  makeEndpoint({
    alias: 'getDDFBundle',
    description: 'Get DDF bundle file',
    method: 'get',
    path: '/api/:apiKey/ddf/bundles/:hash',
    response: prepareResponse(z.instanceof(Blob)),
    reponseFormat: 'blob',
    parameters: [
      globalParameters.apiKey,
      {
        name: 'hash',
        description: 'The hash of the bundle to get',
        type: 'Path',
        schema: z.string(),
      },
    ],
  }),

  makeEndpoint({
    alias: 'getDDFBundleDescriptors',
    description: 'Get all DDF bundle descriptors',
    method: 'get',
    path: '/api/:apiKey/ddf/descriptors',
    response: prepareResponse(
      z.preprocess((descriptors: any) => {
        if (typeof descriptors !== 'object' || descriptors === null)
          return descriptors

        const next = descriptors.next
        if (typeof descriptors.next !== 'undefined')
          delete descriptors.next

        return {
          next,
          descriptors,
        }
      }, z.strictObject({
        next: z.optional(z.union([z.string(), z.number()])),
        descriptors: z.record(z.string(), ddfdDescriptorSchema),
      })),
    ),
    parameters: [
      globalParameters.apiKey,
      {
        name: 'next',
        description: 'The token to get the next page of results',
        type: 'Query',
        schema: z.optional(z.union([z.string(), z.number()])),
      },
    ],
  }),

  /*
  // This endpoint is not implemented in the backend
  makeEndpoint({
    alias: 'getDDFBundleDescriptor',
    description: 'Get DDF bundle descriptor',
    method: 'get',
    path: '/api/:apiKey/ddf/descriptors/:hash',
    response: z.never(),
    parameters: [
      globalParameters.apiKey,
      {
        name: 'hash',
        description: 'The hash of the bundle to get',
        type: 'Path',
        schema: z.string(),
      },
    ],
  }),
  */

  makeEndpoint({
    alias: 'uploadDDFBundle',
    description: 'Uploads a DDF bundle so it can be used by DDF system.',
    method: 'post',
    path: '/api/:apiKey/ddf/bundles',
    response: prepareResponse(
      z.strictObject({ id: z.string() }).transform(result => result.id)
        .describe('The uploaded Bundle Hash'),
    ),
    parameters: [
      globalParameters.apiKey,
      {
        name: 'body',
        type: 'Body',
        schema: z.instanceof(FormData),
      },
    ],
  }),

] as const
