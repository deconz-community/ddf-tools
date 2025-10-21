import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { bytesToHex } from '@noble/hashes/utils.js'
import { describe, expect, it } from 'vitest'
import { Bundle, decode, encode, getHash } from '../index'

describe('tests', () => {
  it('should parse without errors', async () => {
    const data = await readFile(path.join(__dirname, 'ddb/starkvind_air_purifier.ddb'))
    const expectedFileHash = '2570f1d1c81b79946809750b07b2dd4f4bc380b121e345b667b1f7c1a58d5796'
    const expectedHash = '2c46699c8a6d2d76974ae0ecfe697f0973cd62f03bbcd7dae4097cce29d4a47c'
    const blob = new Blob([data])

    expect(bytesToHex(await getHash(new Uint8Array(data)))).toEqual(expectedFileHash)
    // @ts-expect-error ts(2540)
    blob.name = 'starkvind_air_purifier'
    const bundle = await decode(blob)
    expect(bundle.data.hash).toBeDefined()
    expect(bytesToHex(bundle.data.hash!)).toEqual(expectedHash)

    expect(bundle.data.name).toEqual('starkvind_air_purifier')
    expect(bundle.data.desc.product).toEqual('STARKVIND Air purifier')
    expect(bundle.data.files.length).toEqual(36)

    const genericAttributes = bundle.data.files.find(file => file.path === 'generic/items/attr_id_item.json')
    expect(genericAttributes).toBeDefined()
    expect(genericAttributes?.last_modified).toBeDefined()

    const genericConstants = bundle.data.files.find(file => file.path === 'generic/constants_min.json')
    expect(genericConstants).toBeDefined()
    expect(genericConstants?.last_modified).toBeUndefined()

    bundle.data.hash = undefined
    const encoded = encode(bundle)
    const newHash = await getHash(new Uint8Array(await encoded.arrayBuffer()))
    expect(bytesToHex(newHash)).toEqual(expectedFileHash)
  })

  it('should bundle', async () => {
    const bundle = Bundle()

    const fixedDate = new Date('2023-04-27T18:34:00')

    bundle.data.desc.last_modified = fixedDate
    bundle.data.name = 'sample'
    bundle.data.files = [
      {
        type: 'DDFC',
        data: JSON.stringify({
          schema: 'devcap1.schema.json',
        }),
        path: 'ddf.json',
        last_modified: fixedDate,
      },
      {
        type: 'JSON',
        data: JSON.stringify({ foo: 'bar' }),
        path: 'foo.json',
        last_modified: fixedDate,
      },
    ]

    bundle.generateDESC()

    const encoded = encode(bundle)
    const newHash = await getHash(new Uint8Array(await encoded.arrayBuffer()))
    expect(bytesToHex(newHash)).toEqual('0e015a4f4efc5e68d1230edad93a84ca1acad0375f0f08e904c576f1a30aaa17')
  })

  it('should use the correct date', async () => {
    const bundle = Bundle()

    const fixedOldDate = new Date('2001-04-27T18:34:00')
    const fixedDate = new Date('2023-04-27T18:34:00')

    bundle.data.name = 'sample'
    bundle.data.files = [
      {
        type: 'DDFC',
        data: JSON.stringify({
          schema: 'devcap1.schema.json',
        }),
        path: 'ddf.json',
        last_modified: fixedOldDate,
      },
      {
        type: 'JSON',
        data: JSON.stringify({ foo: 'bar' }),
        path: 'foo.json',
        last_modified: fixedDate,
      },
    ]

    bundle.generateDESC()
    const encoded = encode(bundle)
    const decoded = await decode(encoded)

    expect(decoded.data.desc.last_modified).toEqual(fixedDate)
  })
})
