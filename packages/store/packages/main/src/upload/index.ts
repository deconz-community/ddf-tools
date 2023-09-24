import { Buffer } from 'node:buffer'
import { defineHook } from '@directus/extensions-sdk'
import { decode } from '@deconz-community/ddf-bundler'

// import { getStorage } from '@directus/api/storage/index'

export default defineHook(async ({ action, init }, { services }) => {
  action('files.upload', async ({ payload, key }, eventContext) => {
    console.log(payload.title)
    console.log(`File=${key}`)
    console.log(`User=${eventContext.accountability?.user}`)

    // const storage = await getStorage()

    const assetsService = new services.AssetsService(eventContext)
    const { stream } = await assetsService.getAsset(key, { transformationParams: { } }, false)
    const chunks = []
    for await (const chunk of stream)
      chunks.push(chunk)

    const buffer = Buffer.concat(chunks)

    const bundle = await decode(new Blob([buffer]))

    console.log(bundle.data.desc)
  })
})
