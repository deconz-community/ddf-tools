import type { RecordNotUniqueError } from '@directus/errors'
import type { Accountability, PrimaryKey } from '@directus/types'
import type { Collections } from '../../client'
import type { BlobsPayload } from '../multipart-handler'
import type { GlobalContext } from '../types'
import { Buffer } from 'node:buffer'
import { createSignature, decode, encode, generateHash, verifySignature } from '@deconz-community/ddf-bundler'
import { ErrorCode, ForbiddenError, InvalidQueryError, isDirectusError } from '@directus/errors'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import { getPublicKey } from '@noble/secp256k1'
import pako from 'pako'
import { multipartHandler } from '../multipart-handler'
import { asyncHandler, fetchUserContext } from '../utils'

// TODO migrate to @deconz-community/types
type UploadResponse = Record<string, {
  success: true
  createdId: PrimaryKey
} | {
  success: false
  code: 'bundle_hash_already_exists' | 'unknown'
  message: string
}>

export function uploadEndpoint(globalContext: GlobalContext) {
  const { router, context, services, schema } = globalContext

  router.post('/upload/:state', (req, _res, next) => {
    const accountability = 'accountability' in req ? req.accountability as Accountability : null

    if (typeof accountability?.user !== 'string')
      throw new ForbiddenError()

    if (!req.is('multipart/form-data'))
      throw new ForbiddenError()

    next()
  }, multipartHandler, asyncHandler(async (req, res, _next) => {
    // @ts-expect-error - The middleware above ensures that this is defined
    const accountability = req.accountability as Accountability
    const userId = accountability.user!
    const adminAccountability = structuredClone({
      ...accountability,
      admin: true,
    })

    const result: UploadResponse = {}

    const { settings, userInfo } = await fetchUserContext(adminAccountability, userId, globalContext)

    if (!settings.private_key_beta || !settings.private_key_stable || !settings.public_key_beta || !settings.public_key_stable)
      throw new InvalidQueryError({ reason: 'The server is missing the system keys, please contact an admin.' })

    if (!userInfo.public_key || !userInfo.private_key)
      throw new InvalidQueryError({ reason: 'You must setup your keys in your profil settings before uploading bundles.' })

    if (bytesToHex(getPublicKey(hexToBytes(userInfo.private_key))) !== userInfo.public_key)
      throw new InvalidQueryError({ reason: 'Your public key does not match your private key. Please check your user settings' })

    const expectedKeys: [string, string][] = [
      [userInfo.public_key, userInfo.private_key],
    ]
    const unExpectedPublicKeys: string[] = []

    switch (req.params.state) {
      case undefined:
        break
      case 'alpha':
        req.params.state = 'alpha'
        unExpectedPublicKeys.push(settings.public_key_beta)
        unExpectedPublicKeys.push(settings.public_key_stable)
        break
      case 'beta':
        expectedKeys.push([settings.public_key_beta, settings.private_key_beta])
        unExpectedPublicKeys.push(settings.public_key_stable)
        if (!userInfo.is_contributor)
          throw new ForbiddenError()
        break

      case 'stable' :
        expectedKeys.push([settings.public_key_stable, settings.private_key_stable])
        unExpectedPublicKeys.push(settings.public_key_beta)
        if (!userInfo.is_contributor)
          throw new ForbiddenError()
        break
      default:
        throw new InvalidQueryError({ reason: 'Invalid state' })
    }

    await Promise.all(Object.entries(req.body as BlobsPayload).map(async ([uuid, item]) => {
      try {
        const { blob } = item
        let dirty = false

        const bundle = await decode(blob)

        if (!bundle.data.hash)
          throw new InvalidQueryError({ reason: 'Something went wrong during upload. Error code : \'3f33e91812fd\'' })

        // Regenerate the desc to make sure that it matches the content
        const oldHash = bytesToHex(bundle.data.hash)
        bundle.generateDESC()
        bundle.data.hash = await generateHash(bundle.data)
        const hash = bytesToHex(bundle.data.hash)

        if (oldHash !== hash)
          throw new InvalidQueryError({ reason: 'The DESC chunk seems invalid, make sure you are using the latest version of the bundler.' })

        if (!bundle.data.desc.uuid)
          throw new InvalidQueryError({ reason: 'The bundle is missing a UUID, please add a "uuid" field to the DDF json file.' })

        if (!bundle.data.desc.version_deconz)
          throw new InvalidQueryError({ reason: 'The bundle is missing a supported deConz version, please add a "version_deconz" field to the DDF json file.' })

        expectedKeys.forEach(([publicKey, privateKey]) => {
          if (!bundle.data.signatures.some(signature => bytesToHex(signature.key) === publicKey)) {
            const signature = createSignature(bundle.data.hash!, hexToBytes(privateKey))
            bundle.data.signatures.push({
              key: hexToBytes(publicKey),
              signature,
            })
            dirty = true
          }
        })

        const filtredSignatures = bundle.data.signatures
          .filter(signature => !unExpectedPublicKeys.includes(bytesToHex(signature.key)))

        if (filtredSignatures.length !== bundle.data.signatures.length) {
          bundle.data.signatures = filtredSignatures
          dirty = true
        }

        const signatureChecks = await Promise.all(bundle.data.signatures.map(
          async signature => await verifySignature(bundle.data.hash!, signature.key, signature.signature),
        ))

        if (signatureChecks.includes(false))
          throw new InvalidQueryError({ reason: 'Some signature on the bundle are invalid, please remove them before uploading.' })

        // TODO: check for duplicate signatures by key

        const bundleBuffer = await (dirty ? encode(bundle) : blob).arrayBuffer()
        const content = Buffer.from(pako.deflate(bundleBuffer)).toString('base64')

        await context.database.transaction(async (knex) => {
          const serviceOptions = { schema, knex, accountability: adminAccountability }

          const UUIDService = new services.ItemsService<Collections.DdfUuids>('ddf_uuids', serviceOptions)
          const bundleService = new services.ItemsService<Collections.Bundles>('bundles', serviceOptions)
          const deviceIdentifiersService = new services.ItemsService<Collections.DeviceIdentifiers>('device_identifiers', serviceOptions)

          const uuidInfo = (await UUIDService.readByQuery({
            fields: ['id'],
            filter: {
              id: {
                _eq: bundle.data.desc.uuid,
              },
            },
          })).shift()

          if (!uuidInfo) {
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

          const info = bundle.data.files
            .filter(file => file.type === 'INFO')
            .map(file => file.path)
            .join('\n')

          const newBundle = await bundleService.createOne({
            id: hash,
            ddf_uuid: bundle.data.desc.uuid,
            content,
            vendor: bundle.data.desc.vendor,
            product: bundle.data.desc.product,
            content_size: blob.size,
            content_hash: bytesToHex(sha256(new Uint8Array(bundleBuffer))),
            file_count: bundle.data.files.length + 1, // +1 for the DDF file
            version_deconz: bundle.data.desc.version_deconz,
            device_identifiers: device_identifier_ids.map(device_identifiers_id => ({ device_identifiers_id })) as any,
            source_last_modified: bundle.data.desc.last_modified,
            info: info.length > 0 ? info : undefined,
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
        const errorDetails = () => {
          if (isDirectusError<typeof RecordNotUniqueError['prototype']['extensions']>(error, ErrorCode.RecordNotUnique)) {
            switch (error.extensions.collection) {
              case 'bundles':
                switch (error.extensions.field) {
                  case 'id':
                    return {
                      code: 'bundle_hash_already_exists',
                      message: 'Bundle with same hash already exists',
                    } as const
                }
            }
          }

          if (error instanceof Error) {
            return {
              code: 'unknown',
              message: error.message,
            } as const
          }

          return {
            code: 'unknown',
            message: 'Unknown Error',
          } as const
        }

        result[uuid] = {
          success: false,
          ...errorDetails(),
        }
      }
    }))

    res.json({ result })
  }))
}
