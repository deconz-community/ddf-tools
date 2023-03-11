import pako from 'pako'
import { Bundle } from './bundle'
import { DDF_BUNDLE_MAGIC } from './const'
import { isBinaryFileType, isTextFileType } from './utils'

export async function dataDecoder(file: File | Blob) {
  const view = new DataView(await file.arrayBuffer())
  const textDecoder = new TextDecoder()

  const dataReader = (currentOffset = 0) => {
    const read = (size: number): ArrayBuffer => {
      currentOffset += size
      return view.buffer.slice(currentOffset - size, currentOffset)
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
      text,
      Uint16,
      Uint32,
      offset: (shift = 0) => {
        currentOffset += shift
        return currentOffset
      },
    }
  }

  const parseChunks = (
    origin: number,
    dataSize: number,
    parseMethod: ((tag: string, size: number, reader: ReturnType<typeof dataReader>) => void),
  ) => {
    let currentOffset = origin
    while (currentOffset < dataSize) {
      const reader = dataReader(currentOffset)
      const tag = reader.text(4)
      const size = reader.Uint32()
      parseMethod(tag, size, reader)
      currentOffset += 4 + 4 + size
    }
  }

  return {
    dataReader,
    parseChunks,
  }
}

export async function decode(file: File | Blob): Promise<ReturnType<typeof Bundle>> {
  const bundle = Bundle()
  bundle.data.name = file.name

  const { parseChunks } = await dataDecoder(file)

  parseChunks(0, file.size, (tag, size, reader) => {
    switch (tag) {
      case 'RIFF' : {
        parseChunks(reader.offset(), size, (tag, size, reader) => {
          switch (tag) {
            case DDF_BUNDLE_MAGIC : {
              parseChunks(reader.offset(), size, (tag, size, reader) => {
                switch (tag) {
                  case 'DESC' : {
                    bundle.data.desc = JSON.parse(reader.text(size))
                    break
                  }
                  case 'DDFC' : {
                    bundle.data.ddfc = reader.text(size, true)
                    break
                  }
                  case 'EXTF' : {
                    const type = reader.text(4)
                    const path = reader.text(reader.Uint16())
                    const last_modified = new Date(reader.text(reader.Uint16()))
                    if (isTextFileType(type)) {
                      bundle.data.files.push({
                        type,
                        path,
                        last_modified,
                        data: reader.text(reader.Uint32(), true),
                      })
                    }
                    else if (isBinaryFileType(type)) {
                      bundle.data.files.push({
                        type,
                        path,
                        last_modified,
                        data: new Blob([reader.read(reader.Uint32())]),
                      })
                    }
                    else {
                      throw new Error(`Unknown file type :${type}`)
                    }
                    break
                  }
                }
              })
              break
            }
            case 'SIGN' : {
              for (let index = 0; index < size / 192; index++) {
                bundle.data.signatures.push({
                  key: reader.text(64),
                  signature: reader.text(128),
                })
              }
              break
            }
          }
        })
        break
      }
    }
  })

  /*
  const {
    read,
    skip,
    text,
    Uint16,
    Uint32,
    offset,
  } = await dataDecoder(file)

  if (text() !== 'RIFF')
    throw new Error('Invalid RIFF file')

  const dataSize = Uint32()

  if (text() !== DDF_BUNDLE_MAGIC)
    throw new Error('Invalid RIFF file')

  while (offset() <= dataSize) {
    const tag = text()

    switch (tag) {
      case 'DESC':{
        bundle.data.desc = JSON.parse(text(Uint32()))
        break
      }

      case 'DDFC':{
        bundle.data.ddfc = text(Uint32(), true)
        break
      }

      case 'EXTF':{
        skip(4) // We don't need the chunk size
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

  bundle.data.hash = await getHash(
    file,
    8,
    (bundle.data.signatures.length > 0 ? 4 : 0) + bundle.data.signatures.length * (64 + 128),
  )
  */

  return bundle
}
