import { defineHook } from '@directus/extensions-sdk'
import { decode } from '@deconz-community/ddf-bundler'

// https://github.com/directus/directus/issues/19806
import type * as Services from '@directus/api/dist/services/index'
import type { Collections } from '../client'

export default defineHook(async ({ action }, context) => {
  const services = context.services as typeof Services

  action('files.upload', async ({ payload, key }, eventContext) => {
    console.log(payload.title)
    console.log(`File=${key}`)
    console.log(`User=${eventContext.accountability?.user}`)

    // const storage = await getStorage()

    const assetsService = new services.AssetsService({
      accountability: eventContext.accountability,
      schema: eventContext.schema!,
      knex: context.database,
    })

    const asset = await assetsService.getAsset(key, { transformationParams: { } })
    const stream = asset.stream
    const file = asset.file as Collections.DirectusFile

    const chunks = []
    for await (const chunk of stream)
      chunks.push(chunk)

    const bundle = await decode(new Blob(chunks))

    console.log({ stat: asset.stat })

    console.log(bundle.data.desc)
  })
})