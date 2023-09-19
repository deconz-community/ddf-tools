import { Collections } from '../store'

routerAdd('POST', '/bundle/upload', async (ctx) => {
  console.log('------------------ Upload bundle --------------------')

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

    console.log('BigInt', typeof BigInt)

    if (firstBundle === undefined)
      throw new Error('No bundle found')
  }
  catch (e) {
    console.error(e)
  }

  return ctx.json(200, { message: 'Hello' })
}, $apis.requireRecordAuth(Collections.User))
