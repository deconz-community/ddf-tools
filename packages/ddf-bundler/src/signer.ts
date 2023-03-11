import * as secp from '@noble/secp256k1'
import { DDF_BUNDLE_MAGIC } from './const'
import { dataDecoder } from './decoder'

export async function getHash(chunk: ArrayBuffer): Promise<Uint8Array> {
  return await secp.utils.sha256(new Uint8Array(chunk))
}

export async function sign(bundled: Blob, privKeys: string[] = []): Promise<Blob> {
  const decoder = await dataDecoder(bundled)

  const reader = decoder.dataReader()

  if (reader.text(4) !== 'RIFF') {
    reader.offset(-4)
    const tag = reader.text(4)
    throw new Error(`Can't sign this file, invalid tag "${tag}", expect "RIFF"`)
  }

  const RIFFSize = reader.Uint32()

  if (reader.text(4) !== DDF_BUNDLE_MAGIC) {
    reader.offset(-4)
    const tag = reader.text(4)
    throw new Error(`Can't sign this file, invalid tag "${tag}", expect "${DDF_BUNDLE_MAGIC}"`)
  }

  const DDFBSize = reader.Uint32()
  reader.offset(-8)
  const bundleHash = await getHash(reader.read(DDFBSize + 8))

  console.log(bundleHash)

  if (bundled.size !== reader.offset()) {
    decoder.parseChunks(reader.offset(), bundled.size - reader.offset(), (tag, size, reader) => {
      if (tag === 'SIGN')
        console.log('Got sign')
    })
  }

  console.log(bundled.size, reader.offset())

  return bundled

  /*
  const textEncoder = new TextEncoder()

  const buffer = await bundled.arrayBuffer()
  // Skip the first 8 bytes to start at DDF_BUNDLE_MAGIC
  const bundleHash = await getHash(bundled)

  const signatures = await Promise.all(privKeys.map(async (privKey) => {
    const publicKey = secp.Point.fromHex(secp.schnorr.getPublicKey(privKey)).toHexX()
    const auxRand = secp.utils.randomBytes()
    const _sig = (await secp.schnorr.sign(bundleHash, privKey, auxRand))
    const signature = secp.schnorr.Signature.fromHex(_sig).toHex()

    return {
      publicKey,
      signature,
    }
  }))

  const view = new DataView(buffer)
  // Update the size
  view.setUint32(4, view.getUint32(4, true) + 4 + 4 + signatures.length * (64 + 128), true)

  // TODO Use from the encode.ts
  const Uint32 = (num: number): ArrayBuffer => {
    const arr = new ArrayBuffer(4)
    new DataView(arr).setUint32(0, num, true)
    return arr
  }

  // TODO Update this to use existing SIGN chunk
  return new Blob([
    view.buffer,
    textEncoder.encode('SIGN'),
    Uint32(signatures.length * (64 + 128)),
    ...signatures.map((signature) => {
      return textEncoder.encode(signature.publicKey + signature.signature)
    }),

  ])

  */
}

export function verify(hash: Uint8Array, publicKey: string, signature: string): Promise<boolean> {
  return secp.schnorr.verify(signature, hash, publicKey)
}
