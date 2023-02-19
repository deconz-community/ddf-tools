import * as r from 'restructure'
import type { BundleFile } from './types'

export const schema = new r.Struct({
  identifier: new r.String(4),
  size: r.uint32le,
  ddf: new r.Struct({
    identifier: new r.String(4),
    data: new r.Array(
      new r.VersionedStruct(
        new r.String(4),
        {
          DESC: {
            size: r.uint32le,
            data: new r.String('size', 'utf8'),
          },
          DDFC: {
            size: r.uint32le,
            data: new r.String('size', 'utf8'),
          },
          EXTF: {
            type: new r.String(4, 'utf8'),
            pathLength: r.uint16le,
            path: new r.String('pathLength', 'utf8'),
            timestamp: r.uint32le,
            size: r.uint32le,
            data: new r.String('size', 'utf8'),
          },
          SIGN: {
            key: new r.String(32),
            signature: new r.String(64),
          },
        },
      ),
      // Remove 4 of the size to skip the identfier 'DDFB'
      parent => parent.parent.size - 4,
      'bytes',
    ),
  }),
})

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
        type: BundleFile['type']
        pathLength: number
        path: string
        timestamp: number
        size: number
        data: string
      } | {
        version: 'SIGN'
        key: string
        signature: string
      }
    )[]
  }
}
