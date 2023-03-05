import type { BundleData } from './types'

export function encode(data: BundleData): Uint8Array {
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

  console.log(data)
  return new Uint8Array()
}
