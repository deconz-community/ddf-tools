import { z } from 'zod'
import { makeEndpoint } from '@zodios/core'
import { prepareResponse } from '../utils'
import { globalParameters } from '../parameters'

export const ddfEndpoints = [

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
        descriptors: z.record(z.string(), z.strictObject({
          uuid: z.string(),
          product: z.string(),
          version_deconz: z.string(),
          last_modified: z.string(),
          device_identifiers: z.array(
            z.tuple([z.string(), z.string()]),
          ),
        })),
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
