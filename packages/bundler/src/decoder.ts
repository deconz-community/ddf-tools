import pako from 'pako'
import { Bundle } from './bundle'
import { DDF_BUNDLE_MAGIC } from './const'
import { getHash } from './signer'
import { isBinaryFileType, isTextFileType } from './utils'

export async function dataDecoder(file: File | Blob) {
  const view = new DataView(await file.arrayBuffer())
  const textDecoder = new TextDecoder()

  const dataReader = (currentOffset = 0) => {
    const read = (size: number): Uint8Array => {
      currentOffset += size
      return new Uint8Array(view.buffer.slice(currentOffset - size, currentOffset))
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

    const tag = (expectedTag?: string) => {
      const _tag = text(4)
      if (expectedTag && _tag !== expectedTag)
        throw new Error(`Can't read this file, invalid tag "${_tag}", expect "${expectedTag}"`)
      return _tag
    }

    return {
      read,
      text,
      tag,
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
      const tag = reader.tag()
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

  const DDFBBounds = [0, 0]

  parseChunks(0, file.size, (tag, size, reader) => {
    switch (tag) {
      case 'RIFF' : {
        parseChunks(reader.offset(), size, (tag, size, reader) => {
          switch (tag) {
            case DDF_BUNDLE_MAGIC : {
              DDFBBounds[0] = reader.offset() - 8
              DDFBBounds[1] = reader.offset() + size
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
                    const type = reader.tag()
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
              bundle.data.signatures.push({
                key: reader.read(reader.Uint16()),
                signature: reader.read(reader.Uint16()),
              })
              break
            }
          }
        })
        break
      }
    }
  })

  bundle.data.hash = await getHash(new Uint8Array(await file.slice(...DDFBBounds).arrayBuffer()))
  return bundle
}
