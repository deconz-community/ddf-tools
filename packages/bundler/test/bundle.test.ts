import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'
import { bytesToHex } from '@noble/hashes/utils'
import { Bundle, decode, encode, getHash } from '../index'

describe('tests', () => {
  it('should parse without errors', async () => {
    const data = await readFile(path.join(__dirname, 'ddf/starkvind_air_purifier.ddf'))
    const expectedFileHash = '6618077c0d6a74895748ccf5f1be7adb06fa5c05a8cafd6a6c0325362fb34a91'
    const expectedHash = '420bfa2aef0e3fbbc92b58cf4344343b77a53c3a6fc978d6538414bb4e7faf8c'
    const blob = new Blob([data])

    expect(bytesToHex(await getHash(new Uint8Array(data)))).toEqual(expectedFileHash)
    // @ts-expect-error ts(2540)
    blob.name = 'starkvind_air_purifier.ddf'
    const bundle = await decode(blob)
    expect(bundle.data.hash).toBeDefined()
    expect(bytesToHex(bundle.data.hash!)).toEqual(expectedHash)

    expect(bundle.data.name).toEqual('starkvind_air_purifier.ddf')
    expect(bundle.data.desc.product).toEqual('STARKVIND Air purifier')
    expect(bundle.data.files.length).toEqual(35)

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

    bundle.data.desc.ddfc_last_modified = fixedDate
    bundle.data.desc.last_modified = fixedDate
    bundle.data.name = 'sample.ddf'
    bundle.data.files = [
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
    expect(bytesToHex(newHash)).toEqual('865c7668091bb6df93fe8118b19577a1476115a9ffbfe7108930c5e51c3462e2')
  })

  it('should use the correct date', async () => {
    const bundle = Bundle()

    const fixedOldDate = new Date('2001-04-27T18:34:00')
    const fixedDate = new Date('2023-04-27T18:34:00')

    bundle.data.desc.ddfc_last_modified = fixedOldDate
    bundle.data.name = 'sample.ddf'
    bundle.data.files = [
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
