import type { Accountability } from '@directus/types'
import type { Collections } from '../client'
import type { GlobalContext, KeySet } from './types'
import { Buffer } from 'node:buffer'
import { createSignature, decode, encode } from '@deconz-community/ddf-bundler'
import { InvalidQueryError } from '@directus/errors'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import pako from 'pako'

export async function updateBundleSignatures(
  globalContext: GlobalContext,
  accountability: Accountability,
  bundlesIds: string[],
  addKeys: KeySet[],
  removeKeys: KeySet[],
) {
  const { context, services, schema } = globalContext

  const adminAccountability = structuredClone({
    ...accountability,
    admin: true,
  })

  await context.database.transaction(async (knex) => {
    const serviceOptions = { schema, knex, accountability: adminAccountability }

    const bundleService = new services.ItemsService<Collections.Bundles>('bundles', serviceOptions)
    const signatureService = new services.ItemsService<Collections.Signatures>('signatures', serviceOptions)

    const databasePromises: Promise<any>[] = []

    await Promise.all(bundlesIds.map(async (bundleID) => {
      const bundle = await bundleService.readOne(bundleID, {
        fields: [
          'content',
        ],
      })

      if (!bundle.content)
        throw new InvalidQueryError({ reason: 'Bundle not found' })

      let dirty = addKeys.length > 0
      const buffer = Buffer.from(bundle.content, 'base64')
      const decoded = await decode(new Blob([pako.inflate(buffer)]))

      if (!decoded.data.hash)
        throw new InvalidQueryError({ reason: 'Invalid bundle' })

      // Remove Signatures
      decoded.data.signatures = decoded.data.signatures.filter((signature) => {
        const publicKey = bytesToHex(signature.key)

        for (const keySet of removeKeys) {
          if (publicKey !== keySet.public)
            continue

          dirty = true
          databasePromises.push(signatureService.deleteByQuery({
            filter: {
              bundle: { _eq: bundleID },
              key: { _eq: keySet.public },
              type: { _eq: keySet.type },
            },
          }))

          return false
        }

        return true
      })

      // Add Signatures
      for (const keySet of addKeys) {
        if (decoded.data.signatures.some(signature => bytesToHex(signature.key) === keySet.public))
          continue

        databasePromises.push(signatureService.createOne({
          bundle: bundleID,
          key: keySet.public,
          type: keySet.type,
        }))

        decoded.data.signatures.push({
          key: hexToBytes(keySet.public),
          signature: createSignature(decoded.data.hash, hexToBytes(keySet.private)),
        })
      }

      if (dirty) {
        const bundleBuffer = await encode(decoded).arrayBuffer()
        const compressed = Buffer.from(pako.deflate(bundleBuffer)).toString('base64')

        databasePromises.push(bundleService.updateOne(bundleID, {
          content: compressed,
          content_hash: bytesToHex(sha256(new Uint8Array(bundleBuffer))),
        }))
      }
    }))

    await Promise.all(databasePromises)

    // End transaction
  })
}
