import type { BinaryFile, BundleFile, StringFile } from './types'

export const isBinaryType = (type: string) => type === 'UBIN'

export const isBinaryFile = (meta: BundleFile): meta is BinaryFile => {
  return isBinaryType(meta.type)
}

export interface rawData {
  identifier: 'RIFF'
  size: number
  ddf: {
    identifier: 'DDFB'
    data: (
      | {
        version: 'DESC' | 'DDFC'
        size: number
        data: string
      }
      | {
        version: 'EXTF'
        type: StringFile['type']
        pathLength: number
        path: string
        timestamp: number
        size: number
        data: string
      } | {
        version: 'EXTF'
        type: BinaryFile['type']
        pathLength: number
        path: string
        timestamp: number
        size: number
        data_raw: Uint8Array
      } | {
        version: 'SIGN'
        key: string
        signature: string
      }
    )[]
  }
}
