import type { BundleData } from './types'
import { schema } from './schema'

export function Bundle() {
  let name = 'bundle.ddf'
  const data: BundleData = {
    desc: {},
    ddfc: {},
  }

  const parseFile = async (file: File) => {
    name = file.name
    const buffer = await file.arrayBuffer()
    const rawData = new DataView(buffer)

    const result = schema.fromBuffer(new Uint8Array(buffer) as Buffer)
    console.log(result)

    return result
    /*
    const decoder = new TextDecoder()

    function getText(offset: number, length = 4) {
      return decoder.decode(rawData.buffer.slice(offset, offset + length))
    }

    function getChunk(offset: number) {
      const identifier = getText(offset)
      const length = rawData.getUint32(offset + 4, true)

      return { identifier, length }
    }

    function parseChunk(currentOffset = 0, path = '') {
      if (path.length > 0)
        path += '.'
      path += getText(currentOffset)
      console.log('Found chunk', path)

      switch (path) {
        case 'RIFF':
          // 8 because of the RIFF and the RIFF length
          parseChunk(currentOffset + 8, path)

          break

        case `RIFF.${DDF_BUNDLE_MAGIC}`:
          // 4 because of the RIFF and the RIFF length
          parseChunk(currentOffset + 4, path)

          break

        default:
          console.warn('Unknown chunk', path)

          break
      }
    }

    parseChunk()
    */

    console.log(rawData)
  }

  return { name, parseFile, data }
}
