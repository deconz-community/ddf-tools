import type { BufferData } from './encoder'

import type { ChunkSignature } from './types'

import { secp256k1 } from '@noble/curves/secp256k1'
import { sha256 } from '@noble/hashes/sha256'
import { DDF_BUNDLE_MAGIC } from './const'
import { dataDecoder } from './decoder'
import { dataEncoder } from './encoder'
import { isUint8ArrayEqual } from './utils'

export async function getHash(chunk: Uint8Array): Promise<Uint8Array> {
  return sha256(chunk)
}

export interface PrivateKeyData {
  key: Uint8Array
}

export async function sign(bundled: Blob, privKeys: PrivateKeyData[] = []): Promise<Blob> {
  const signatures: ChunkSignature[] = []
  const decoder = await dataDecoder(bundled)
  const reader = decoder.dataReader()

  reader.tag('RIFF')
  // const RIFFSize = reader.Uint32()
  reader.offset(4)
  reader.tag(DDF_BUNDLE_MAGIC)

  const DDFBSize = reader.Uint32()
  reader.offset(-8)
  const DDFBChunk = reader.read(DDFBSize + 8)
  const bundleHash = await getHash(DDFBChunk)

  // If we have more data to read
  if (bundled.size !== reader.offset()) {
    decoder.parseChunks(reader.offset(), bundled.size - reader.offset(), (tag, _size, reader) => {
      if (tag === 'SIGN') {
        signatures.push({
          key: reader.read(reader.Uint16()),
          signature: reader.read(reader.Uint16()),
        })
      }
    })
  }

  await Promise.all(privKeys.map(async (privKey) => {
    const key = secp256k1.getPublicKey(privKey.key)

    const signature = createSignature(bundleHash, privKey.key)

    let replaced = false
    for (let index = 0; index < signatures.length; index++) {
      if (isUint8ArrayEqual(key, signatures[index].key)) {
        signatures[index].signature = signature
        replaced = true
        return
      }
    }
    if (replaced)
      return

    signatures.push({
      key,
      signature,
    })
  }))

  const newData: BufferData[] = []

  const {
    addData,
    // text,
    Uint16,
    // Uint32,
    withLength,
    chunk,
  } = dataEncoder(newData)

  addData(
    chunk('RIFF', [
      DDFBChunk,
      signatures.map(signature =>
        chunk('SIGN', [
          withLength(signature.key, Uint16),
          withLength(signature.signature, Uint16),
        ]),
      ),
    ]),
  )

  return new Blob(newData)
}

export function createSignature(hash: Uint8Array, privateKey: Uint8Array): Uint8Array {
  return secp256k1.sign(hash, privateKey).toCompactRawBytes()
}

export async function verifySignature(hash: Uint8Array, publicKey: Uint8Array, signature: Uint8Array): Promise<boolean> {
  try {
    return secp256k1.verify(signature, hash, publicKey)
  }
  catch (e) {
    console.error(e)
    return false
  }
}
