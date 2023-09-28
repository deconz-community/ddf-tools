import { defineHook } from '@directus/extensions-sdk'
import { decode } from '@deconz-community/ddf-bundler'
import { bytesToHex } from '@noble/hashes/utils'

// https://github.com/directus/directus/issues/19806
import type * as Services from '@directus/api/dist/services/index'
import type { Collections } from '../client'

export default defineHook(async ({ action }, context) => {
  const services = context.services as typeof Services
  const database = context.database

  action('files.upload', async ({ payload, key }, eventContext) => {
    /*
    console.log(payload.title)
    console.log(`File=${key}`)
    console.log(`User=${eventContext.accountability?.user}`)
    console.log(eventContext.accountability)
    */

    const serviceOptions = {
      schema: await context.getSchema(),
      knex: context.database,
    } as const
    // const storage = await getStorage()

    const assetsService = new services.AssetsService(serviceOptions)
    const deviceIdentifiersService = new services.ItemsService<Collections.DeviceIdentifiers>('device_identifiers', serviceOptions)
    const bundleService = new services.ItemsService<Collections.Bundles>('bundles', serviceOptions)
    const websocketService = new services.WebSocketService()

    const asset = await assetsService.getAsset(key, { transformationParams: { } })
    const stream = asset.stream
    const file = asset.file as Collections.DirectusFile

    const chunks = []
    for await (const chunk of stream)
      chunks.push(chunk)

    const bundle = await decode(new Blob(chunks))

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

    if (!bundle.data.hash)
      throw new Error('No hash')

    const newBundle = await bundleService.createOne({
      ddf_uuid: bundle.data.desc.uuid,
      asset: file,
      hash: bytesToHex(bundle.data.hash),
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

    if (eventContext.accountability?.user) {
      websocketService.broadcast({
        type: 'notification',
        data: {
          title: 'New bundle',
          message: `New bundle ${newBundle} uploaded`,
        },
      }, {
        user: eventContext.accountability.user,
      })
    }
  })
})
