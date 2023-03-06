import pako from 'pako'
import { Bundle } from './bundle'
import { DDF_BUNDLE_MAGIC } from './const'
import { getHash } from './signer'
import { isBinaryFileType, isTextFileType } from './utils'

export async function dataDecoder(file: File | Blob) {
  let currentOffset = 0
  const view = new DataView(await file.arrayBuffer())
  const textDecoder = new TextDecoder()

  const read = (size: number): ArrayBuffer => {
    currentOffset += size
    return view.buffer.slice(currentOffset - size, currentOffset)
  }

  const skip = (size: number) => {
    currentOffset += size
  }

  const text = (size = 4, decompress = false) => {
    let data = read(size)
    if (decompress === true)
      data = pako.inflate(data)
    return textDecoder.decode(data)
  }

  const Uint16 = () => {
    const result = view.getUint16(currentOffset, true)
    currentOffset += 2
    return result
  }

  const Uint32 = () => {
    const result = view.getUint32(currentOffset, true)
    currentOffset += 4
    return result
  }

  return {
    read,
    skip,
    text,
    Uint16,
    Uint32,
    offset: () => currentOffset,
  }
}

export async function decode(file: File | Blob): Promise<ReturnType<typeof Bundle>> {
  const bundle = Bundle()
  bundle.data.name = file.name

  const { read, text, Uint16, Uint32, offset } = await dataDecoder(file)

  if (text() !== 'RIFF')
    throw new Error('Invalid RIFF file')

  const dataSize = Uint32()

  if (text() !== DDF_BUNDLE_MAGIC)
    throw new Error('Invalid RIFF file')

  while (offset() <= dataSize) {
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
        bundle.data.signatures.push({
          key: text(64),
          signature: text(128),
        })
        break
      }
      default:
        throw new Error(`Unknown chunk with tag: ${tag} as offset: ${offset()}`)
    }
  }

  console.log(bundle.data.signatures)

  bundle.data.hash = await getHash(
    file,
    8,
    (bundle.data.signatures.length > 0 ? 4 : 0) + bundle.data.signatures.length * (64 + 128),
  )

  return bundle
}
