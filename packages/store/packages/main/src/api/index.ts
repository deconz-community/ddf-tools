import { Buffer } from 'node:buffer'

import { defineEndpoint } from '@directus/extensions-sdk'
import type * as Services from '@directus/api/dist/services/index'
import type { Accountability, PrimaryKey } from '@directus/types'
import { createError, isDirectusError } from '@directus/errors'
import type { RecordNotUniqueErrorExtensions } from '@directus/api/dist/errors/record-not-unique'

import { bytesToHex } from '@noble/hashes/utils'
import pako from 'pako'
import { compare } from 'compare-versions'

import { decode } from '@deconz-community/ddf-bundler'

import { asyncHandler } from '../utils'
import type { Collections } from '../client'
import { multipartHandler } from './multipart-handler'

const ForbiddenError = createError('FORBIDDEN', 'You need to be authenticated to access this endpoint', 403)

export default defineEndpoint({
  id: 'bundle',
  handler: async (router, context) => {
    const services = context.services as typeof Services
    const schema = await context.getSchema()

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
        // @ts-expect-error - The middleware above ensures that this is defined
        const accountability = req.accountability as Accountability
        const adminAccountability = structuredClone({
          ...accountability,
          admin: true,
        })

        if (req.body.tag === undefined)
          req.body.tag = 'latest'

        const result: Record<string, {
          success: boolean
          createdId?: PrimaryKey
          message?: string
        }> = {}

        await Promise.all(Object.entries(req.body.files).map(async ([uuid, _file]) => {
          try {
            const file = _file as Blob

            const bundle = await decode(file)
            if (!bundle.data.hash)
              throw new Error('No hash')

            if (!bundle.data.desc.uuid)
              throw new Error('The bundle is missing a UUID, please add a "uuid" field to the DDF json file.')
            if (!bundle.data.desc.version)
              throw new Error('The bundle is missing a version, please add a "version" field to the DDF json file.')
            if (!bundle.data.desc.version_deconz)
              throw new Error('The bundle is missing a supported deConz version, please add a "version_deconz" field to the DDF json file.')

            const hash = bytesToHex(bundle.data.hash)
            const content = Buffer.from(pako.deflate(await file.arrayBuffer())).toString('base64')

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

              const existingBundleForTag = await bundleService.readByQuery({
                fields: ['id', 'version'],
                filter: {
                  _and: [
                    { tag: { _eq: req.body.tag } },
                    { ddf_uuid: { _eq: bundle.data.desc.uuid } },
                  ],
                },
              })

              if (existingBundleForTag[0]) {
                const existingVersion = existingBundleForTag[0].version as string
                const newVersion = bundle.data.desc.version
                if (!compare(newVersion, existingVersion, '>'))
                  throw new Error(`New version should be greater than existing version (existing: ${existingVersion}, new: ${newVersion})`)
              }

              const newBundle = await bundleService.createOne({
                id: hash,
                ddf_uuid: bundle.data.desc.uuid,
                content,
                product: bundle.data.desc.product,
                tag: req.body.tag,
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
                createdId: newBundle,
              }
            })
          }
          catch (error) {
            const message = () => {
              if (isDirectusError<RecordNotUniqueErrorExtensions>(error, 'RECORD_NOT_UNIQUE')) {
                switch (error.extensions.collection) {
                  case 'bundles':
                    switch (error.extensions.field) {
                      case 'id':
                        return 'Bundle with same hash already exists'
                      case 'version':
                        return 'Bundle with same version already exists'
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
      }),
    )
  },
})
