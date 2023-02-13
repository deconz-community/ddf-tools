import * as r from 'restructure'

export const schema = new r.Struct({
  identifier: new r.String(4),
  size: r.uint32le,
  ddf: new r.Struct({
    identifier: new r.String(4),
    data: new r.Array(new r.VersionedStruct(new r.String(4), {
      DESC: {
        size: r.uint32le,
        data: new r.String('size', 'utf8'),
      },
      DDFC: {
        size: r.uint32le,
        data: new r.String('size', 'utf8'),
      },
      EXTF: {
        pathLength: r.uint16le,
        path: new r.String('pathLength', 'utf8'),
        timestamp: r.uint32le,
        fileSize: r.uint32le,
        data: new r.String('fileSize', 'utf8'),
      },
    },
    ), parent => parent.parent.size - 12, 'bytes'),
  }),
})

/*

new r.VersionedStruct(new r.String(4), {
        DESC: {
          length: r.uint32le,
        },
        DFFC: {
          length: r.uint32le,
        },
      }

      */
