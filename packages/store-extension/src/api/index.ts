import { Buffer } from 'node:buffer'
import { Stream } from 'node:stream'

import { defineEndpoint } from '@directus/extensions-sdk'
import type * as Services from '@directus/api/dist/services/index'
import type { Accountability, PrimaryKey } from '@directus/types'
import type { RecordNotUniqueError } from '@directus/errors'
import { ErrorCode, ForbiddenError, InvalidQueryError, isDirectusError } from '@directus/errors'
import { createSignature, decode, encode, generateHash, verifySignature } from '@deconz-community/ddf-bundler'
import { secp256k1 } from '@noble/curves/secp256k1'

import { bytesToHex, hexToBytes } from '@noble/hashes/utils'
import pako from 'pako'
import slugify from '@sindresorhus/slugify'

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

    async function fetchUserContext(accountability: Accountability, userId: string) {
      const serviceOptions = { schema, knex: context.database, accountability }
      const userService = new services.UsersService(serviceOptions)
      const settingsService = new services.SettingsService(serviceOptions)

      const settingsFields = [
        'private_key_stable',
        'public_key_stable',
        'private_key_beta',
        'public_key_beta',
      ] as const

      const userFields = [
        'id',
        'private_key',
        'public_key',
        'can_sign_with_system_keys',
      ] as const

      const [
        settings,
        userInfo,
      ] = await Promise.all([
        settingsService.readSingleton({
          fields: settingsFields as any,
        }),
        userService.readOne(userId, {
          fields: userFields as any,
        }),
      ]) as any

      return {
        settings,
        userInfo,
      } as {
        settings: Pick<Collections.DirectusSettings, typeof settingsFields[number]>
        userInfo: Pick<Collections.DirectusUser, typeof userFields[number]>
      }
    }

    router.get('/search', asyncHandler(async (req, res, next) => {
      const accountability = 'accountability' in req ? req.accountability as Accountability : null
      const serviceOptions = { schema, knex: context.database, accountability }

      const product = typeof req.query.product === 'string' && req.query.product !== '' ? req.query.product : null
      const manufacturer = typeof req.query.manufacturer === 'string' && req.query.manufacturer !== '' ? req.query.manufacturer : null
      const model = typeof req.query.model === 'string' && req.query.model !== '' ? req.query.model : null
      const hasKey = typeof req.query.hasKey === 'string' && req.query.hasKey !== '' ? req.query.hasKey : null
      const showDeprecated = req.query.showDeprecated === 'true'
      let limit = 20

      const subquery = context.database('bundles')
        .select('bundles.ddf_uuid')
        .max('date_created as max_date')
        .orderBy('max_date', 'desc')
        .groupBy('ddf_uuid')

      if (showDeprecated === false)
        subquery.whereNull('bundles.deprecation_message')

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

      if (hasKey) {
        subquery
          .join('signatures', 'bundles.id', '=', 'signatures.bundle')
          .where('signatures.key', hasKey)
      }

      const query = context.database
        .select('bundles.id')
        .from('bundles')
        .join(subquery.as('subquery'), function () {
          this.on('bundles.ddf_uuid', '=', 'subquery.ddf_uuid')
            .andOn('bundles.date_created', '=', 'subquery.max_date')
        })

      if (showDeprecated === false) {
        query
          .join('ddf_uuids', 'bundles.ddf_uuid', '=', 'ddf_uuids.id')
          .whereNull('ddf_uuids.deprecation_message')
      }

      if (typeof req.query.limit === 'string' && req.query.limit !== '') {
        limit = Math.min(Number.parseInt(req.query.limit), limit)
        query.limit(limit)
        if (typeof req.query.page === 'string' && req.query.page !== '')
          query.offset(limit * (Number.parseInt(req.query.page) - 1))
      }

      query.orderBy('bundles.date_created', 'desc')

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
          'signatures.type',
        ],
        filter: {
          id: {
            _in: (await query).map(item => item.id),
          },
        },
        sort: ['-date_created'],
      })

      let totalCount = Number.POSITIVE_INFINITY
      if (items.length < limit) {
        totalCount = items.length
      }
      else {
        const queryCount = query
          .clone()
          .clearSelect()
          .clear('limit')
          .clear('offset')
          .count('bundles.id as count')
          .clear('join')
          .join(subquery.clone().as('subquery'), function () {
            this.on('bundles.ddf_uuid', '=', 'subquery.ddf_uuid')
              .andOn('bundles.date_created', '=', 'subquery.max_date')
          })

        if (showDeprecated === false)
          queryCount.join('ddf_uuids', 'bundles.ddf_uuid', '=', 'ddf_uuids.id')

        const countResult = (await queryCount.clone()).shift()

        if (countResult && countResult.count && typeof countResult.count === 'number')
          totalCount = countResult.count
      }

      res.json({ items, totalCount })
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
      const userId = accountability.user!
      const adminAccountability = structuredClone({
        ...accountability,
        admin: true,
      })

      const result: UploadResponse = {}

      const { settings, userInfo } = await fetchUserContext(adminAccountability, userId)

      if (!settings.public_key_beta || !settings.public_key_stable)
        throw new InvalidQueryError({ reason: 'The server is missing the system keys, please contact an admin.' })

      if (!userInfo.public_key || !userInfo.private_key)
        throw new InvalidQueryError({ reason: 'You must setup your keys in your profil settings before uploading bundles.' })

      const privateKey = hexToBytes(userInfo.private_key)

      // TODO move this check on the update profil hook
      // const privateKey = hexToBytes(userInfo.public_key)
      const publicKey = secp256k1.getPublicKey(privateKey)
      if (bytesToHex(publicKey) !== userInfo.public_key)
        throw new InvalidQueryError({ reason: 'Your public key does not match your private key. Please check your user settings' })

      await Promise.all(Object.entries(req.body as BlobsPayload).map(async ([uuid, item]) => {
        try {
          const { blob } = item
          let dirty = false

          const bundle = await decode(blob)

          if (!bundle.data.hash)
            throw new InvalidQueryError({ reason: 'Something went wrong during upload. Error code : \'3f33e91812fd\'' })

          // Regenerate the desc to make sure that it matches the content
          const oldHash = bytesToHex(bundle.data.hash)
          bundle.generateDESC(true)
          bundle.data.hash = await generateHash(bundle.data)
          const hash = bytesToHex(bundle.data.hash)

          if (oldHash !== hash)
            throw new InvalidQueryError({ reason: 'The DESC chunk seems invalid, make sure you are using the latest version of the bundler.' })

          if (!bundle.data.desc.uuid)
            throw new InvalidQueryError({ reason: 'The bundle is missing a UUID, please add a "uuid" field to the DDF json file.' })

          if (!bundle.data.desc.version_deconz)
            throw new InvalidQueryError({ reason: 'The bundle is missing a supported deConz version, please add a "version_deconz" field to the DDF json file.' })

          if (!bundle.data.signatures.some(signature => bytesToHex(signature.key) === userInfo.public_key)) {
            const signature = createSignature(bundle.data.hash, privateKey)
            bundle.data.signatures.push({
              key: publicKey,
              signature,
            })
            dirty = true
          }

          const signatureChecks = await Promise.all(bundle.data.signatures.map(
            async signature => await verifySignature(bundle.data.hash!, signature.key, signature.signature),
          ))

          if (signatureChecks.includes(false))
            throw new InvalidQueryError({ reason: 'Some signature on the bundle are invalid, please remove them before uploading.' })

          // TODO check for duplicate signatures by key

          const bundleBuffer = await (dirty ? encode(bundle) : blob).arrayBuffer()
          const content = Buffer.from(pako.deflate(bundleBuffer)).toString('base64')

          await context.database.transaction(async (knex) => {
            const serviceOptions = { schema, knex, accountability: adminAccountability }

            const UUIDService = new services.ItemsService<Collections.DdfUuids>('ddf_uuids', serviceOptions)
            const bundleService = new services.ItemsService<Collections.Bundles>('bundles', serviceOptions)
            const deviceIdentifiersService = new services.ItemsService<Collections.DeviceIdentifiers>('device_identifiers', serviceOptions)

            const uuidInfo = (await UUIDService.readByQuery({
              fields: [
                'id',
                'user_created',
                'maintainers.user',
              ],
              filter: {
                id: {
                  _eq: bundle.data.desc.uuid,
                },
              },
            })).shift()

            if (uuidInfo) {
              if (uuidInfo.user_created !== userId && !uuidInfo.maintainers.some(m => m.user === userId))
                throw new InvalidQueryError({ reason: 'You don\'t have permission to upload a bundle with that UUID because you are not the maintainer of it' })
            }
            else {
              await UUIDService.createOne({
                id: bundle.data.desc.uuid,
              })
            }

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
              content_size: blob.size,
              file_count: bundle.data.files.length + 1, // +1 for the DDF file
              version_deconz: bundle.data.desc.version_deconz,
              device_identifiers: device_identifier_ids.map(device_identifiers_id => ({ device_identifiers_id })) as any,
              signatures: bundle.data.signatures.map((signature) => {
                const key = bytesToHex(signature.key)
                const type = key === settings.public_key_stable || key === settings.public_key_beta ? 'system' : 'user'
                return {
                  key,
                  type,
                }
              }) as any,
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

    router.post('/sign/:id', asyncHandler(async (req, res, next) => {
      const accountability = 'accountability' in req ? req.accountability as Accountability : null

      if (typeof accountability?.user !== 'string')
        throw new ForbiddenError()

      const adminAccountability = structuredClone({
        ...accountability,
        admin: true,
      })

      const serviceOptions = { schema, knex: context.database, accountability: adminAccountability }

      const bundleService = new services.ItemsService<Collections.Bundles>('bundles', serviceOptions)

      const { type, state } = req.query
      const bundleID = req.params.id

      if (typeof bundleID !== 'string')
        throw new InvalidQueryError({ reason: 'Invalid bundle id' })

      if (type !== 'system')
        throw new InvalidQueryError({ reason: 'Only system signature are supported for now' })

      if (typeof state !== 'string')
        throw new InvalidQueryError({ reason: 'Invalid type' })

      if (!['alpha', 'beta', 'stable'].includes(state))
        throw new InvalidQueryError({ reason: 'Invalid state' })

      const bundle = await bundleService.readOne(bundleID, {
        fields: [
          'content',
        ],
      })

      if (!bundle.content)
        throw new InvalidQueryError({ reason: 'Bundle not found' })

      const { settings, userInfo } = await fetchUserContext(adminAccountability, accountability.user)

      if (!userInfo.can_sign_with_system_keys)
        throw new ForbiddenError()

      const buffer = Buffer.from(bundle.content, 'base64')

      const decoded = await decode(new Blob([pako.inflate(buffer)]))

      if (!decoded.data.hash)
        throw new InvalidQueryError({ reason: 'Invalid bundle' })

      const keysToUse = state === 'stable'
        ? {
            privateKey: settings.private_key_stable,
            publicKey: settings.public_key_stable,
          }
        : state === 'beta'
          ? {
              privateKey: settings.private_key_beta,
              publicKey: settings.public_key_beta,
            }
          : {}

      const { publicKey, privateKey } = keysToUse

      if (state !== 'alpha' && (!publicKey || !privateKey))
        throw new InvalidQueryError({ reason: 'The server is missing the system keys, please contact an admin.' })

      // Remove current system signature and check if the bundle is already signed by the system key
      decoded.data.signatures = decoded.data.signatures.filter((signature) => {
        const key = bytesToHex(signature.key)

        if (key === publicKey)
          throw new InvalidQueryError({ reason: 'Bundle already signed by this key' })

        return key !== settings.public_key_stable
          && key !== settings.public_key_beta
      })

      if (state !== 'alpha') {
        decoded.data.signatures.push({
          key: hexToBytes(publicKey!),
          signature: createSignature(decoded.data.hash, hexToBytes(privateKey!)),
        })
      }

      const compressed = Buffer.from(pako.deflate(await encode(decoded).arrayBuffer())).toString('base64')

      await context.database.transaction(async (knex) => {
        const serviceOptions = { schema, knex, accountability: adminAccountability }

        const bundleService = new services.ItemsService<Collections.Bundles>('bundles', serviceOptions)
        const signatureService = new services.ItemsService<Collections.Signatures>('signatures', serviceOptions)

        const currentSystemSignature = (await signatureService.readByQuery({
          fields: [
            'id',
            'key',
            'type',
          ],
          filter: {
            type: {
              _eq: 'system',
            },
            bundle: {
              _eq: bundleID,
            },
          },

        })).shift()

        const promises = []

        promises.push(bundleService.updateOne(bundleID, {
          content: compressed,
        }))

        if (state === 'alpha') {
          if (currentSystemSignature) {
            promises.push(
              signatureService.deleteOne(currentSystemSignature.id),
            )
          }
        }
        else {
          if (currentSystemSignature === undefined) {
            promises.push(
              signatureService.createOne({
                bundle: bundleID,
                key: publicKey!,
                type: 'system',
              }),
            )
          }
          else {
            promises.push(
              signatureService.updateOne(currentSystemSignature.id, {
                key: publicKey!,
              }),
            )
          }
        }

        return await Promise.all(promises)
      })

      res.json({ success: true, type, state })
    }))

    router.post('/deprecate', asyncHandler(async (req, res, next) => {
      const accountability = 'accountability' in req ? req.accountability as Accountability : null

      const userId = accountability?.user

      if (typeof accountability?.user !== 'string' || !userId)
        throw new ForbiddenError()

      const adminAccountability = structuredClone({
        ...accountability,
        admin: true,
      })

      const serviceOptions = { schema, knex: context.database, accountability: adminAccountability }

      const UUIDService = new services.ItemsService<Collections.DdfUuids>('ddf_uuids', serviceOptions)

      const { type, message, ddf_uuid, bundle_id } = req.query

      if (typeof type !== 'string' || !['bundle', 'version'].includes(type))
        throw new InvalidQueryError({ reason: 'You can only deprecate bundle or version' })
      if (typeof ddf_uuid !== 'string')
        throw new InvalidQueryError({ reason: 'You must provide a ddf_uuid' })
      if (typeof message === 'string' && message !== 'null' && message.length < 10)
        throw new InvalidQueryError({ reason: 'You must provide a message with at least 10 characters or \'null\'' })

      if (type === 'version' && typeof bundle_id !== 'string')
        throw new InvalidQueryError({ reason: 'You must provide a bundle_id' })

      const uuidInfo = (await UUIDService.readByQuery({
        fields: [
          'id',
          'user_created',
          'maintainers.user',
        ],
        filter: {
          id: {
            _eq: ddf_uuid,
          },
        },
      })).shift()

      if (uuidInfo === undefined)
        throw new InvalidQueryError({ reason: 'UUID not found' })

      if (uuidInfo.user_created !== userId && !uuidInfo.maintainers.some(m => m.user === userId))
        throw new InvalidQueryError({ reason: 'You don\'t have permission to modify a bundle with that UUID because you are not the maintainer of it' })

      if (type === 'bundle') {
        await UUIDService.updateOne(ddf_uuid, {
          deprecation_message: message === 'null' ? null : message as string,
        })
        return res.json({ success: true })
      }

      const bundleService = new services.ItemsService<Collections.Bundles>('bundles', serviceOptions)

      const bundle = await bundleService.readOne(bundle_id as string, {
        fields: [
          'ddf_uuid',
        ],
      })

      if (bundle.ddf_uuid !== ddf_uuid)
        throw new InvalidQueryError({ reason: 'The bundle does not match the UUID' })

      await bundleService.updateOne(bundle_id as string, {
        deprecation_message: message === 'null' ? null : message as string,
      })

      res.json({ success: true })
    }))
  },
})
