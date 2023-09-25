import { defineHook } from '@directus/extensions-sdk'
import { decode } from '@deconz-community/ddf-bundler'

// import type * as Services from '@directus/api/dist/services/index'

// import { getStorage } from '@directus/api/storage/index'

export default defineHook(async ({ action }, context) => {
  const services = context.services // as typeof Services

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

    const { stream } = await assetsService.getAsset(key, { transformationParams: { } })
    const chunks = []
    for await (const chunk of stream)
      chunks.push(chunk)

    const bundle = await decode(new Blob(chunks))

    console.log(bundle.data.desc)
  })
})
