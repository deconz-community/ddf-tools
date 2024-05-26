import { Buffer } from 'node:buffer'
import { createSignature, decode, encode } from '@deconz-community/ddf-bundler'
import { ForbiddenError, InvalidQueryError } from '@directus/errors'
import type { Accountability } from '@directus/types'
import { sha256 } from '@noble/hashes/sha256'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils'
import pako from 'pako'
import type { Collections } from '../../client'
import type { InstallFunctionParams } from '../types'
import { asyncHandler, fetchUserContext } from '../utils'

export function signEndpoint(params: InstallFunctionParams) {
  const { router, context, services, schema } = params
  router.post('/sign/:id', asyncHandler(async (req, res) => {
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

    const { settings, userInfo } = await fetchUserContext(adminAccountability, accountability.user, params)

    if (!userInfo.is_contributor)
      throw new ForbiddenError()

    const bundle = await bundleService.readOne(bundleID, {
      fields: [
        'content',
      ],
    })

    if (!bundle.content)
      throw new InvalidQueryError({ reason: 'Bundle not found' })

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

    const bundleBuffer = await encode(decoded).arrayBuffer()
    const compressed = Buffer.from(pako.deflate(bundleBuffer)).toString('base64')

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
        content_hash: bytesToHex(sha256(new Uint8Array(bundleBuffer))),
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
}
