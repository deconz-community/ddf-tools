import type { Bundle } from './bundle'
import { DDF_BUNDLE_MAGIC } from './const'

export function encode(bundle: ReturnType<typeof Bundle>): Blob {
  const data = bundle.data
  const buffers: (Uint8Array | ArrayBuffer)[] = []

  const textEncoder = new TextEncoder()

  const text = (value: string) => {
    return textEncoder.encode(value)
  }

  const U32 = (num: number) => {
    const arr = new ArrayBuffer(4)
    new DataView(arr).setUint32(0, num, true) // byteOffset = 0; litteEndian = false
    return arr
  }

  buffers.push(text('RIFF'))
  buffers.push(text(DDF_BUNDLE_MAGIC))

  const desc = text(JSON.stringify(data.desc))
  buffers.push(text('DESC'))
  buffers.push(U32(desc.length))
  buffers.push(desc)

  return new Blob(buffers)

  /*
  const rawData: rawData = {
    identifier: 'RIFF',
    size: 0,
    ddf: {
      identifier: 'DDFB',
      data: [],
    },
  }

  const strDESC = JSON.stringify(data.desc)
  rawData.ddf.data.push({
    version: 'DESC',
    size: strDESC.length,
    data: strDESC,
  })

  const strDDFC = data.ddfc
  rawData.ddf.data.push({
    version: 'DDFC',
    size: strDDFC.length,
    data: strDDFC,
  })

  for (const file of data.files) {
    if (isBinaryFile(file)) {
      const dataView = new Uint8Array(await file.data.arrayBuffer())
      rawData.ddf.data.push({
        version: 'EXTF',
        type: file.type,
        pathLength: file.path.length + 1,
        path: `${file.path}\x00`,
        timestamp: file.last_modified.getTime(),
        size: dataView.byteLength,
        data_raw: dataView,
      })
    }
    else {
      rawData.ddf.data.push({
        version: 'EXTF',
        type: file.type,
        pathLength: file.path.length + 1,
        path: `${file.path}\x00`,
        timestamp: file.last_modified.getTime(),
        size: file.data.length,
        data: file.data as string,
      })
    }
  }

  // Remove 8 of the size to skip the identfier 'RIFF' and the size
  rawData.size = schema.size(rawData) - 8

  const newBundle = schema.toBuffer(rawData)

  return newBundle

  */
}
