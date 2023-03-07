import pako from 'pako'

import type { Bundle } from './bundle'
import { DDF_BUNDLE_MAGIC } from './const'

type BufferData = Uint8Array | ArrayBuffer | Blob | BufferData[]

export function dataEncoder(chunks: BufferData[] = []) {
  const textEncoder = new TextEncoder()

  const text = (value: string, compress = false) => {
    const result = textEncoder.encode(value)
    if (compress === true)
      return pako.deflate(result)
    return result
  }

  const Uint16 = (num: number): ArrayBuffer => {
    const arr = new ArrayBuffer(2)
    new DataView(arr).setUint16(0, num, true)
    return arr
  }

  const Uint32 = (num: number): ArrayBuffer => {
    const arr = new ArrayBuffer(4)
    new DataView(arr).setUint32(0, num, true)
    return arr
  }

  const getDataLength = (data: BufferData): number => {
    if (Array.isArray(data)) {
      return data
        .map(getDataLength)
        .reduce((partialSum, a) => partialSum + a, 0)
    }
    else if (data instanceof Uint8Array) {
      return data.length
    }
    else if (data instanceof ArrayBuffer) {
      return data.byteLength
    }
    else if (data instanceof Blob) {
      return data.size
    }
    return 0
  }

  const withLength = (data: BufferData, lengthMethod: ((num: number) => ArrayBuffer) = Uint32) => {
    return [
      lengthMethod(getDataLength(data)),
      data,
    ]
  }

  const addData = (...datas: BufferData[]) => {
    datas.forEach((data) => {
      if (Array.isArray(data))
        addData(...data)
      else chunks.push(data)
    })
  }

  return {
    addData,
    text,
    Uint16,
    Uint32,
    getDataLength,
    withLength,
  }
}

export function encode(bundle: ReturnType<typeof Bundle>): Blob {
  const data = bundle.data
  const chunks: BufferData[] = []

  const {
    addData,
    text,
    Uint16,
    Uint32,
    getDataLength,
    withLength,
  } = dataEncoder(chunks)

  addData(text(DDF_BUNDLE_MAGIC))
  addData(text('DESC'), withLength(text(JSON.stringify(data.desc))))
  addData(text('DDFC'), withLength(text(data.ddfc, true)))

  data.files.forEach((file) => {
    addData(
      text('EXTF'),
      text(file.type),
      withLength(text(file.path), Uint16),
      withLength(text(file.last_modified.toISOString()), Uint16),
      withLength(typeof file.data === 'string' ? text(file.data, true) : file.data),
    )
  })

  data.signatures.forEach((signature) => {
    addData(
      text('SIGN'),
      text(signature.key),
      text(signature.signature),
    )
  })

  const flattenData = (data: BufferData): (Uint8Array | ArrayBuffer | Blob)[] => {
    if (Array.isArray(data)) {
      const result: (Uint8Array | ArrayBuffer | Blob)[] = []
      for (const item of data)
        result.push(...flattenData(item))

      return result
    }
    return [data]
  }

  const result = new Blob(flattenData([
    text('RIFF'),
    withLength(chunks),
  ]))

  return result
}
