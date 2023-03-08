import pako from 'pako'

import type { Bundle } from './bundle'
import { DDF_BUNDLE_MAGIC } from './const'

type BufferData = Uint8Array | ArrayBuffer | Blob
type BufferDataR = BufferData | BufferDataR[]

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

  const getDataLength = (data: BufferDataR): number => {
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

  const withLength = (data: BufferDataR, lengthMethod: ((num: number) => ArrayBuffer) = Uint32) => {
    return [
      lengthMethod(getDataLength(data)),
      data,
    ]
  }

  const addData = (...datas: BufferDataR[]) => {
    datas.forEach((data) => {
      if (Array.isArray(data))
        addData(...data)
      else chunks.push(data)
    })
  }

  const chunk = (tag: string, data: BufferDataR, lengthMethod: ((num: number) => ArrayBuffer) = Uint32) => {
    const length = getDataLength(data)
    if (length > 0) {
      return [
        text(tag),
        lengthMethod(length),
        data,
      ]
    }
    else { return [] }
  }

  return {
    addData,
    chunk,
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
    // Uint32,
    withLength,
    chunk,
  } = dataEncoder(chunks)

  addData(
    chunk('RIFF', [
      chunk(DDF_BUNDLE_MAGIC, [
        chunk('DESC', text(JSON.stringify(data.desc))),
        chunk('DDFC', text(data.ddfc, true)),
        data.files.map(file => chunk('EXTF', [
          text(file.type),
          withLength(text(file.path), Uint16),
          withLength(text(file.last_modified.toISOString()), Uint16),
          withLength(typeof file.data === 'string' ? text(file.data, true) : file.data),
        ])),
      ]),
      chunk('SIGN',
        data.signatures.map(signature => [
          text(signature.key),
          text(signature.signature),
        ]),
      ),
    ]),
  )

  return new Blob(chunks)
}
