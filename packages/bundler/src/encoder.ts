import pako from 'pako'

import type { Bundle } from './bundle'
import { DDF_BUNDLE_MAGIC } from './const'

export type BufferData = Uint8Array | ArrayBuffer | Blob
export type BufferDataR = BufferData | BufferDataR[]

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

export function encodeDDFB(encoder: ReturnType<typeof dataEncoder>, data: ReturnType<typeof Bundle>['data']) {
  return encoder.chunk(DDF_BUNDLE_MAGIC, [
    encoder.chunk('DESC', encoder.text(JSON.stringify(data.desc))),
    // TODO : check if it's compressed
    encoder.chunk('DDFC', encoder.text(data.ddfc, false)),
    data.files.map(file => encoder.chunk('EXTF', [
      encoder.text(file.type),
      encoder.withLength(encoder.text(file.path), encoder.Uint16),
      encoder.withLength(encoder.text(file.last_modified.toISOString()), encoder.Uint16),
      // TODO : check if it's compressed
      encoder.withLength(typeof file.data === 'string' ? encoder.text(file.data, false) : file.data),
    ])),
  ])
}

export function encode(bundle: ReturnType<typeof Bundle>, preEncodedDDFB?: BufferDataR): Blob {
  const data = bundle.data
  const chunks: BufferData[] = []

  const encoder = dataEncoder(chunks)

  const { addData, Uint16, withLength, chunk } = encoder
  addData(
    chunk('RIFF', [
      preEncodedDDFB ?? encodeDDFB(encoder, data),
      data.signatures.map(signature =>
        chunk('SIGN',
          [
            withLength(signature.key, Uint16),
            withLength(signature.signature, Uint16),
          ],
        ),
      ),
    ]),
  )

  return new Blob(chunks)
}
