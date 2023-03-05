import type { BundleData } from './types'
import type { rawData } from './schema'
import { isBinaryFile, isBinaryType, schema } from './schema'
import { buildFromFile } from './builder'

export function Bundle() {
  const data: BundleData = {
    name: 'bundle.ddf',
    desc: {
      last_modified: new Date(),
      device_identifiers: [],
    },
    ddfc: '{}',
    files: [],
    signatures: [],
  }

  const parseFile = async (file: File) => {
    data.name = file.name
    data.files = []
    data.signatures = []
    const buffer = new Uint8Array(await file.arrayBuffer())
    const rawData: rawData = schema.fromBuffer(buffer as Buffer) as rawData
    for (const chunk of rawData.ddf.data) {
      switch (chunk.version) {
        case 'DESC': {
          data.desc = JSON.parse(chunk.data)
          data.desc.last_modified = new Date(data.desc.last_modified)
          break
        }

        case 'DDFC': {
          data.ddfc = chunk.data
          break
        }

        case 'EXTF': {
          if (!isBinaryType(chunk.type)) {
            // @ts-expect-error WIP
            data.files.push({
              type: chunk.type,
              // @ts-expect-error WIP
              data: chunk.data,
              last_modified: new Date(chunk.timestamp),
              path: chunk.path.trim().replaceAll('\x00', ''),
              format: 'markdown',
            })
          }
          break
        }

        case 'SIGN': {
          data.signatures.push({
            key: chunk.key,
            signature: chunk.signature,
          })
          break
        }
      }
    }
  }

  const makeBundle = async () => {
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
  }

  const checkSignature = () => true

  return { parseFile, makeBundle, checkSignature, data }
}

Bundle.buildFromFile = buildFromFile
