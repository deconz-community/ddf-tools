import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'
import { bytesToHex } from '@noble/hashes/utils'
import { Bundle, decode, encode, getHash } from '../index'

describe('tests', () => {
  it('should parse without errors', async () => {
    const data = await readFile(path.join(__dirname, 'ddf/starkvind_air_purifier.ddf'))
    const expectedFileHash = '690d5564228784720462d6497d5ca7cb53d8a2a3195e3a47b762cd16fa70bf8c'
    const expectedHash = '239554d340589d629cefc4834a9b1883cce1e397def85ce3bd66c305a70739c2'
    const blob = new Blob([data])

    expect(bytesToHex(await getHash(new Uint8Array(data)))).toEqual(expectedFileHash)
    // @ts-expect-error ts(2540)
    blob.name = 'starkvind_air_purifier.ddf'
    const bundle = await decode(blob)
    expect(bundle.data.hash).toBeDefined()
    expect(bytesToHex(bundle.data.hash!)).toEqual(expectedHash)

    expect(bundle.data.name).toEqual('starkvind_air_purifier.ddf')
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
    bundle.data.name = 'sample.ddf'
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
    expect(bytesToHex(newHash)).toEqual('d2da53691cee8d948afca284e92545c092919619d92e8dcb7453bd68faf323cf')
  })

  it('should use the correct date', async () => {
    const bundle = Bundle()

    const fixedOldDate = new Date('2001-04-27T18:34:00')
    const fixedDate = new Date('2023-04-27T18:34:00')

    bundle.data.name = 'sample.ddf'
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
