/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
import { Collections } from '../store'

routerAdd('POST', '/bundle/upload', async (ctx) => {
  console.log('------------------ Upload bundle --------------------')

  const { fromByteArray } = require('base64-js')

  try {
    // console.log(ctx.formFile('bundle'))

    // const store = require('../store')

    ctx.request()?.parseMultipartForm(2 * 1024 * 1024)

    const data = ctx.multipartForm()

    const bundles: Uint8Array[] = []

    data?.file.bundle.forEach((file: multipart.FileHeader) => {
      const { filename, size } = file
      console.log(filename, size)
      const reader = file.open() as os.File // Not the correct type
      const data = new Uint8Array(size)
      reader.read(data as any)
      reader.close()

      bundles.push(data)

      // console.log(data)
    })

    const firstBundle = bundles[0]

    const encoded = fromByteArray(firstBundle)

    console.log(`encoded=${encoded.length}`)

    // console.log(encoded)
    const result = $os.exec('./ddf-tools.sh', 'bundler', '-i', encoded)
    // const result = $os.exec('pwd', '')

    if (result === undefined)
      return

    const resultData = String.fromCharCode.apply(null, result.output() as any)

    console.log('resultData=', resultData)

    const parsed = JSON.parse(resultData)

    // console.log(firstBundle.toString())
    // console.log(firstBundle)
    console.log(parsed.product)

    if (firstBundle === undefined)
      throw new Error('No bundle found')
  }
  catch (e) {
    console.error(e)
  }

  return ctx.json(200, { message: 'Hello' })
}, $apis.requireRecordAuth(Collections.User))
