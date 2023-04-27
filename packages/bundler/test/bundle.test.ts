import { readFile } from 'fs/promises'
import path from 'path'

import { describe, expect, it } from 'vitest'
import { bytesToHex } from '@noble/hashes/utils'
import { Bundle, decode, encode, getHash } from '../index'

describe('Tests', () => {
  it('should parse without errors', async () => {
    const data = await readFile(path.join(__dirname, 'ddf/aq1_vibration_sensor.ddf'))
    const expectedFileHash = 'f4e33902e41ef153dd448bc3f34af0f4f03c8eb2c3c7ad1460d76287b5e7b153'
    const expectedHash = 'f333554d2b37acd2452a16b6a9fe3f89e27036a553b1405aefc5448cc689b09d'
    const blob = new Blob([data])

    expect(bytesToHex(await getHash(new Uint8Array(data)))).toEqual(expectedFileHash)
    // @ts-expect-error ts(2540)
    blob.name = 'aq1_vibration_sensor.ddf'
    const bundle = await decode(blob)
    expect(bundle.data.hash).toBeDefined()
    expect(bytesToHex(bundle.data.hash!)).toEqual(expectedHash)
    expect(bundle.data.name).toEqual('aq1_vibration_sensor.ddf')
    expect(bundle.data.desc.product).toEqual('Aqara Vibration Sensor DJT11LM')
    expect(bundle.data.files.length).toEqual(26)

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
    expect(bytesToHex(newHash)).toEqual('24497080bf171946271884ccc9c5184f4cd79c929371cec9b3dde72644b729af')
  })
})
