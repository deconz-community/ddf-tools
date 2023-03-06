import type { BinaryFile, TextFile } from './types'

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
        type: TextFile['type']
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
