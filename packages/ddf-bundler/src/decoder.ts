import { Bundle } from './bundle'

export async function decode(file: File): Promise<ReturnType<typeof Bundle>> {
  const bundle = Bundle()

  bundle.data.name = file.name
  bundle.data.files = []
  bundle.data.signatures = []
  const buffer = new Uint8Array(await file.arrayBuffer())

  /*
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
    */

  return bundle
}
