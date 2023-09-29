import { Buffer } from 'node:buffer'
import { defineEndpoint } from '@directus/extensions-sdk'
import type * as Services from '@directus/api/dist/services/index'
import { createError } from '@directus/errors'
import type { Accountability } from '@directus/types'
import { decode } from '@deconz-community/ddf-bundler'
import { bytesToHex } from '@noble/hashes/utils'
import pako from 'pako'
import { asyncHandler } from '../utils'
import type { Collections } from '../client'
import { multipartHandler } from './multipart-handler'

const ForbiddenError = createError('FORBIDDEN', 'You need to be authenticated to access this endpoint', 403)

export default defineEndpoint({
  id: 'bundle',
  handler: async (router, context) => {
    const services = context.services as typeof Services
    const serviceOptions = {
      schema: await context.getSchema(),
      knex: context.database,
    } as const

    router.post('/upload',
      (req, res, next) => {
        const accountability = 'accountability' in req ? req.accountability as Accountability : null

        if (typeof accountability?.user !== 'string')
          throw new ForbiddenError()

        if (!req.is('multipart/form-data'))
          throw new ForbiddenError()

        next()
      },
      asyncHandler(multipartHandler),
      asyncHandler(async (req, res, next) => {
        const accountability = 'accountability' in req ? req.accountability as Accountability : null
        const bundleService = new services.ItemsService<Collections.Bundles>('bundles', serviceOptions)
        const deviceIdentifiersService = new services.ItemsService<Collections.DeviceIdentifiers>('device_identifiers', serviceOptions)

        console.log({ result: req.body })

        const result: Record<string, {
          success: boolean
          message?: string
        }> = {}

        await Promise.all(Object.entries(req.body.files).map(async ([uuid, _file]) => {
          try {
            const file = _file as Blob

            const bundle = await decode(file)
            console.log(uuid, bundle.data.desc)
            if (!bundle.data.hash)
              throw new Error('No hash')

            const device_identifier_ids = await Promise.all(bundle.data.desc.device_identifiers.map(async (deviceIdentifier) => {
              const [manufacturer, model] = deviceIdentifier

              const device_identifier_id = await deviceIdentifiersService.readByQuery({
                fields: ['id'],
                filter: {
                  manufacturer: {
                    _eq: manufacturer,
                  },
                  model: {
                    _eq: model,
                  },
                },
              })

              if (device_identifier_id.length > 0)
                return device_identifier_id[0]!.id

              return await deviceIdentifiersService.createOne({
                manufacturer,
                model,
              })
            }))

            const buffer = await file.arrayBuffer()

            const newBundle = await bundleService.createOne({
              id: bytesToHex(bundle.data.hash),
              ddf_uuid: bundle.data.desc.uuid,
              content: Buffer.from(pako.deflate(buffer)).toString('base64'),
              product: bundle.data.desc.product,
              tag: 'latest',
              version: bundle.data.desc.version,
              version_deconz: bundle.data.desc.version_deconz,
              device_identifiers: device_identifier_ids.map(device_identifiers_id => ({ device_identifiers_id })) as any,
              signatures: bundle.data.signatures.map(signature => ({
                signature: bytesToHex(signature.signature),
                key: bytesToHex(signature.key),
              })) as any,
            })

            result[uuid] = {
              success: true,
              message: newBundle as string ?? 'Unknown Error',
            }
          }
          catch (e) {
            result[uuid] = {
              success: false,
              message: e instanceof Error ? e.message : 'Unknown Error',
            }
          }
        }))

        const { PermissionsService } = services

        const permission = new PermissionsService({
          accountability,
          schema: await context.getSchema(),
        })

        res.json({ result })
      }),
    )
  },
})
