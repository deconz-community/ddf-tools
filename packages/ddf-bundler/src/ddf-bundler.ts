import type { BundleData } from './types'
import type { rawData } from './schema'
import { schema } from './schema'

export function Bundle() {
  const data: BundleData = {
    name: 'bundle.ddf',
    desc: {
      last_modified: new Date(),
      vp: [],
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
          data.files.push({
            type: 'SCJS',
            data: chunk.data,
            last_modified: new Date(chunk.timestamp),
            path: chunk.path.trim().replaceAll('\x00', ''),
          })
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

    data.files.forEach((file) => {
      rawData.ddf.data.push({
        version: 'EXTF',
        type: file.type,
        pathLength: file.path.length + 1,
        path: `${file.path}\x00`,
        timestamp: file.last_modified.getTime(),
        size: file.data.length,
        data: file.data as string,
      })
    })

    // Remove 8 of the size to skip the identfier 'RIFF' and the size
    rawData.size = schema.size(rawData) - 8

    const newBundle = schema.toBuffer(rawData)

    return newBundle
  }

  const checkSignature = () => true

  const buildFromFile = async (path: string, getFile: (path: string) => Promise<string>) => {
    data.name = `${path.substring(path.lastIndexOf('/') + 1, path.lastIndexOf('.'))}.ddf`
    data.ddfc = await getFile(path)
    const ddfc = JSON.parse(data.ddfc)

    const scripts: string[] = []
    if (Array.isArray(ddfc.subdevices)) {
      ddfc.subdevices.forEach((subdevice) => {
        if (Array.isArray(subdevice.items)) {
          subdevice.items.forEach((item) => {
            for (const [key, value] of Object.entries(item)) {
              if (value.script !== undefined)
                scripts.push(value.script)
            }
          })
        }
      })
    }

    await Promise.all(scripts.map(async (filePath) => {
      data.files.push({
        data: await getFile(new URL(`${path}/../${filePath}`).href),
        last_modified: new Date(),
        path: filePath,
        type: 'SCJS',
      })
    }))
  }

  return { parseFile, makeBundle, checkSignature, buildFromFile, data }
}
