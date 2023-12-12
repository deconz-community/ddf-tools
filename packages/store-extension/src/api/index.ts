import { Buffer } from 'node:buffer'
import { Stream } from 'node:stream'

import { defineEndpoint } from '@directus/extensions-sdk'
import type * as Services from '@directus/api/dist/services/index'
import type { Accountability, PrimaryKey } from '@directus/types'
import type { RecordNotUniqueError } from '@directus/errors'
import { ErrorCode, createError, isDirectusError } from '@directus/errors'

import { bytesToHex } from '@noble/hashes/utils'
import pako from 'pako'
import slugify from '@sindresorhus/slugify'

import { decode } from '@deconz-community/ddf-bundler'

import { asyncHandler } from '../utils'
import type { Collections } from '../client'
import type { BlobsPayload } from './multipart-handler'
import { multipartHandler } from './multipart-handler'

const ForbiddenError = createError('FORBIDDEN', 'You need to be authenticated to access this endpoint', 403)

export default defineEndpoint({
  id: 'bundle',
  handler: async (router, context) => {
    const services = context.services as typeof Services
    const schema = await context.getSchema()

    router.post('/upload', (req, res, next) => {
      const accountability = 'accountability' in req ? req.accountability as Accountability : null

      if (typeof accountability?.user !== 'string')
        throw new ForbiddenError()

      if (!req.is('multipart/form-data'))
        throw new ForbiddenError()

      next()
    }, asyncHandler(multipartHandler), asyncHandler(async (req, res, next) => {
      // @ts-expect-error - The middleware above ensures that this is defined
      const accountability = req.accountability as Accountability
      const adminAccountability = structuredClone({
        ...accountability,
        admin: true,
      })

      const result: Record<string, {
        success: boolean
        createdId?: PrimaryKey
        message?: string
      }> = {}

      await Promise.all(Object.entries(req.body as BlobsPayload).map(async ([uuid, item]) => {
        try {
          const { blob } = item

          const bundle = await decode(blob)
          if (!bundle.data.hash)
            throw new Error('No hash')

          if (!bundle.data.desc.uuid)
            throw new Error('The bundle is missing a UUID, please add a "uuid" field to the DDF json file.')
          if (!bundle.data.desc.version_deconz)
            throw new Error('The bundle is missing a supported deConz version, please add a "version_deconz" field to the DDF json file.')

          const hash = bytesToHex(bundle.data.hash)
          const content = Buffer.from(pako.deflate(await blob.arrayBuffer())).toString('base64')

          await context.database.transaction(async (knex) => {
            const serviceOptions = { schema, knex, accountability: adminAccountability }

            const bundleService = new services.ItemsService<Collections.Bundles>('bundles', serviceOptions)
            const deviceIdentifiersService = new services.ItemsService<Collections.DeviceIdentifiers>('device_identifiers', serviceOptions)

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

            const newBundle = await bundleService.createOne({
              id: hash,
              ddf_uuid: bundle.data.desc.uuid,
              content,
              product: bundle.data.desc.product,
              version_deconz: bundle.data.desc.version_deconz,
              device_identifiers: device_identifier_ids.map(device_identifiers_id => ({ device_identifiers_id })) as any,
              signatures: bundle.data.signatures.map(signature => ({
                signature: bytesToHex(signature.signature),
                key: bytesToHex(signature.key),
              })) as any,
            })

            result[uuid] = {
              success: true,
              createdId: newBundle,
            }
          })
        }
        catch (error) {
          const message = () => {
            if (isDirectusError<typeof RecordNotUniqueError['prototype']['extensions']>(error, ErrorCode.RecordNotUnique)) {
              switch (error.extensions.collection) {
                case 'bundles':
                  switch (error.extensions.field) {
                    case 'id':
                      return 'Bundle with same hash already exists'
                  }
              }
            }

            if (error instanceof Error)
              return error.message

            return 'Unknown Error'
          }

          result[uuid] = {
            success: false,
            message: message(),
          }
        }
      }))

      res.json({ result })
    }))

    router.get('/download/:id', asyncHandler(async (req, res, next) => {
      const accountability = 'accountability' in req ? req.accountability as Accountability : null

      const serviceOptions = { schema, knex: context.database, accountability }

      const bundleService = new services.ItemsService<Collections.Bundles>('bundles', serviceOptions)

      if (typeof req.params.id !== 'string')
        throw new Error('Invalid bundle id')

      const bundle = await bundleService.readOne(req.params.id, {
        fields: [
          'product',
          'content',
        ],
      })

      if (!bundle.content)
        throw new Error('Bundle not found')

      const fileName = `${slugify(`${bundle.product}-${req.params.id.substring(req.params.id.length - 10)}`)}.ddf`

      const buffer = Buffer.from(bundle.content, 'base64')
      const decompressed = Buffer.from(pako.inflate(buffer))
      const readStream = new Stream.PassThrough()
      readStream.end(decompressed)

      res.set('Content-disposition', `attachment; filename=${fileName}`)
      res.set('Content-Type', 'text/plain')

      readStream.pipe(res)
    }))
  },
})
