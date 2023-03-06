import pako from 'pako'
import { Bundle } from './bundle'
import { DDF_BUNDLE_MAGIC } from './const'
import { isBinaryFileType, isTextFileType } from './utils'

export async function decode(file: File): Promise<ReturnType<typeof Bundle>> {
  const bundle = Bundle()
  console.log('decode', file.name)

  bundle.data.name = file.name

  const view = new DataView(await file.arrayBuffer())
  let offset = 0
  const textDecoder = new TextDecoder()

  const read = (size: number): ArrayBuffer => {
    offset += size
    return view.buffer.slice(offset - size, offset)
  }

  const text = (size = 4, decompress = false) => {
    let data = read(size)
    if (decompress === true)
      data = pako.inflate(data)
    return textDecoder.decode(data)
  }

  const Uint32 = () => {
    const result = view.getUint32(offset, true)
    offset += 4
    return result
  }

  const Uint16 = () => {
    const result = view.getUint16(offset, true)
    offset += 2
    return result
  }

  if (text() !== 'RIFF')
    throw new Error('Invalid RIFF file')

  const dataSize = Uint32()

  if (text() !== DDF_BUNDLE_MAGIC)
    throw new Error('Invalid RIFF file')

  // eslint-disable-next-line no-unmodified-loop-condition
  while (offset <= dataSize) {
    const tag = text()

    switch (tag) {
      case 'DESC':{
        bundle.data.desc = JSON.parse(text(Uint32(), true))
        break
      }

      case 'DDFC':{
        bundle.data.ddfc = text(Uint32(), true)
        break
      }

      case 'EXTF':{
        const type = text(4)
        const path = text(Uint16())
        const last_modified = new Date(text(Uint16()))
        if (isTextFileType(type)) {
          bundle.data.files.push({
            type,
            path,
            last_modified,
            data: text(Uint32(), true),
          })
        }
        else if (isBinaryFileType(type)) {
          bundle.data.files.push({
            type,
            path,
            last_modified,
            data: new Blob([read(Uint32())]),
          })
        }
        else {
          throw new Error(`Unknown file type :${type}`)
        }
        break
      }

      case 'SIGN':{
        /* TODO WIP
        bundle.data.signatures.push({
          key: read(32),
          signature: read(64),
        })
        */
        break
      }
      default:
        throw new Error(`Unknown chunk with tag: ${tag}`)
    }
  }

  return bundle
}
