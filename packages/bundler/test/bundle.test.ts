import { readFile } from 'fs/promises'
import path from 'path'

import { describe, expect, it } from 'vitest'
import { bytesToHex } from '@noble/hashes/utils'
import { Bundle, decode, encode, getHash } from '../index'

describe('Tests', () => {
  it('should parse without errors', async () => {
    const data = await readFile(path.join(__dirname, 'ddf/starkvind_air_purifier.ddf'))
    const expectedFileHash = 'f46faa39a35a83f92cbc0c360b0b4f75f4ab06b2c4c8ade9e10667f16834fde7'
    const expectedHash = '8c521ccd440b9e548797c3a82f7e1893479138dccb13ecdce8bc36401ce525a6'
    const blob = new Blob([data])

    expect(bytesToHex(await getHash(new Uint8Array(data)))).toEqual(expectedFileHash)
    // @ts-expect-error ts(2540)
    blob.name = 'starkvind_air_purifier.ddf'
    const bundle = await decode(blob)
    expect(bundle.data.hash).toBeDefined()
    expect(bytesToHex(bundle.data.hash!)).toEqual(expectedHash)
    expect(bundle.data.name).toEqual('starkvind_air_purifier.ddf')
    expect(bundle.data.desc.product).toEqual('STARKVIND Air purifier')
    expect(bundle.data.files.length).toEqual(39)

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
        type: 'JSON',
        data: JSON.stringify({ foo: 'bar' }),
        path: 'foo.json',
        last_modified: fixedDate,
      },
    ]

    const encoded = encode(bundle)
    const newHash = await getHash(new Uint8Array(await encoded.arrayBuffer()))
    expect(bytesToHex(newHash)).toEqual('68485e669407950815c49a32c720ca7d720b04ffb9120469c0d1850234d38c02')
  })
})
