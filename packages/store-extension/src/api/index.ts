import { Buffer } from 'node:buffer'
import { Stream } from 'node:stream'

import { defineEndpoint } from '@directus/extensions-sdk'
import type * as Services from '@directus/api/dist/services/index'
import type { Accountability, PrimaryKey } from '@directus/types'
import type { RecordNotUniqueError } from '@directus/errors'
import { ErrorCode, ForbiddenError, InvalidQueryError, isDirectusError } from '@directus/errors'

import { bytesToHex } from '@noble/hashes/utils'
import pako from 'pako'
import slugify from '@sindresorhus/slugify'

import { decode } from '@deconz-community/ddf-bundler'

import { asyncHandler } from '../utils'
import type { Collections } from '../client'
import type { BlobsPayload } from './multipart-handler'
import { multipartHandler } from './multipart-handler'

// TODO migrate to @deconz-community/types
type UploadResponse = Record<string, {
  success: boolean
  createdId?: PrimaryKey
  message?: string
}>

export default defineEndpoint({
  id: 'bundle',
  handler: async (router, context) => {
    const services = context.services as typeof Services
    const schema = await context.getSchema()

    router.get('/search', asyncHandler(async (req, res, next) => {
      const accountability = 'accountability' in req ? req.accountability as Accountability : null
      const serviceOptions = { schema, knex: context.database, accountability }

      const product = typeof req.query.product === 'string' && req.query.product !== '' ? req.query.product : null
      const manufacturer = typeof req.query.manufacturer === 'string' && req.query.manufacturer !== '' ? req.query.manufacturer : null
      const model = typeof req.query.model === 'string' && req.query.model !== '' ? req.query.model : null

      const subquery = context.database('bundles')
        .select('bundles.ddf_uuid')
        .max('date_created as max_date')
        .orderBy('max_date', 'desc')
        .groupBy('ddf_uuid')

      if (product)
        subquery.where(context.database.raw('LOWER(`product`) LIKE ?', [`%${product.toLowerCase()}%`]))

      if ((manufacturer) || (model)) {
        subquery
          .join('bundles_device_identifiers', 'bundles.id', '=', 'bundles_device_identifiers.bundles_id')
          .join('device_identifiers', 'bundles_device_identifiers.device_identifiers_id', '=', 'device_identifiers.id')

        if (manufacturer)
          subquery.where(context.database.raw('LOWER(`manufacturer`) LIKE ?', [`%${manufacturer.toLowerCase()}%`]))

        if (model)
          subquery.where(context.database.raw('LOWER(`model`) LIKE ?', [`%${model.toLowerCase()}%`]))
      }

      if (typeof req.query.limit === 'string' && req.query.limit !== '') {
        const limit = Math.min(Number.parseInt(req.query.limit), 20)

        subquery.limit(limit)
        if (typeof req.query.page === 'string' && req.query.page !== '')
          subquery.offset(limit * (Number.parseInt(req.query.page) - 1))
      }

      /*
      const query = context.database
        .select([
          'bundles.ddf_uuid',
          'bundles.id',
          'bundles.product',
          'bundles.date_created',
          'device_identifiers.manufacturer',
          'device_identifiers.model',
          'signatures.signature',
          'signatures.key',
        ])
        .from('bundles')
        .join(subquery.as('subquery'), function () {
          this.on('bundles.ddf_uuid', '=', 'subquery.ddf_uuid')
            .andOn('bundles.date_created', '=', 'subquery.max_date')
        })
        .join('bundles_device_identifiers', 'bundles.id', '=', 'bundles_device_identifiers.bundles_id')
        .join('device_identifiers', 'bundles_device_identifiers.device_identifiers_id', '=', 'device_identifiers.id')
        .join('signatures', 'bundles.id', '=', 'signatures.bundle')
        .orderBy('bundles.date_created', 'desc')
      */

      const query = context.database
        .select('bundles.id')
        .from('bundles')
        .join(subquery.as('subquery'), function () {
          this.on('bundles.ddf_uuid', '=', 'subquery.ddf_uuid')
            .andOn('bundles.date_created', '=', 'subquery.max_date')
        })
        .orderBy('bundles.date_created', 'desc')

      const bundleService = new services.ItemsService<Collections.Bundles>('bundles', serviceOptions)
      const items = await bundleService.readByQuery({
        fields: [
          'id',
          'product',
          'ddf_uuid',
          'date_created',
          'device_identifiers.device_identifiers_id.manufacturer',
          'device_identifiers.device_identifiers_id.model',
          'signatures.key',
        ],
        filter: {
          id: {
            _in: (await query).map(item => item.id),
          },
        },
        sort: ['-date_created'],
      })

      res.json(items)
    }))

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

      const result: UploadResponse = {}

      await Promise.all(Object.entries(req.body as BlobsPayload).map(async ([uuid, item]) => {
        try {
          const { blob } = item

          const bundle = await decode(blob)
          if (!bundle.data.hash)
            throw new InvalidQueryError({ reason: 'No hash' })

          if (!bundle.data.desc.uuid)
            throw new InvalidQueryError({ reason: 'The bundle is missing a UUID, please add a "uuid" field to the DDF json file.' })

          if (!bundle.data.desc.version_deconz)
            throw new InvalidQueryError({ reason: 'The bundle is missing a supported deConz version, please add a "version_deconz" field to the DDF json file.' })

          // TODO verify signatures
          // Either remove the signatures from the bundle or deny the upload
          // Make sure that the bundle is signed by the user that is uploading it

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
        throw new InvalidQueryError({ reason: 'Invalid bundle id' })

      const bundle = await bundleService.readOne(req.params.id, {
        fields: [
          'product',
          'content',
        ],
      })

      if (!bundle.content)
        throw new InvalidQueryError({ reason: 'Bundle not found' })

      const fileName = `${slugify(`${bundle.product}-${req.params.id.substring(req.params.id.length - 10)}`)}.ddf`

      const buffer = Buffer.from(bundle.content, 'base64')
      const decompressed = Buffer.from(pako.inflate(buffer))
      const readStream = new Stream.PassThrough()
      readStream.end(decompressed)

      res.set('Content-disposition', `attachment; filename=${fileName}`)
      res.set('Content-Type', 'text/plain')

      readStream.pipe(res)
    }))

    router.get('/userinfo', asyncHandler(async (req, res, next) => {
      const serviceOptions = {
        schema,
        knex: context.database,
      }

      const filter: Partial<Record<'public_key' | 'id', string>> = {}

      if (typeof req.query.userKey === 'string')
        filter.public_key = req.query.userKey

      if (typeof req.query.userId === 'string')
        filter.id = req.query.userId

      if (Object.keys(filter).length === 0) {
        throw new InvalidQueryError({
          reason: 'You must post either a userKey or a userId',
        })
      }

      const userService = new services.UsersService(serviceOptions)
      const result = await userService.readByQuery({
        fields: [
          'id',
          'first_name',
          'last_name',
          'avatar_url',
          'date_created',
          'public_key',
        ],
        // @ts-expect-error - I added this field don't worry
        filter,
      })

      const user = result.pop()

      if (!user) {
        throw new InvalidQueryError({
          reason: 'User not found',
        })
      }

      res.json(user)
    }))
  },
})
