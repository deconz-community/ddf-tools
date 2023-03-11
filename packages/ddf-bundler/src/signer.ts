import * as secp from '@noble/secp256k1'
import { DDF_BUNDLE_MAGIC } from './const'
import { dataDecoder } from './decoder'
import type { BufferData } from './encoder'
import { dataEncoder } from './encoder'
import type { ChunkSignature } from './types'

export async function getHash(chunk: Uint8Array): Promise<Uint8Array> {
  return secp.utils.sha256(chunk)
}

export interface PrivateKeyData {
  type: ChunkSignature['type']
  key: Uint8Array
  source?: string
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
  const DDFBContent = reader.read(DDFBSize + 8)
  const bundleHash = await getHash(DDFBContent)

  // If we have more data to read
  if (bundled.size !== reader.offset()) {
    decoder.parseChunks(reader.offset(), bundled.size - reader.offset(), (tag, size, reader) => {
      if (tag === 'SIGN') {
        signatures.push({
          type: reader.tag() as ChunkSignature['type'],
          source: reader.text(reader.Uint16()),
          key: reader.read(reader.Uint16()),
          signature: reader.read(reader.Uint16()),
        })
      }
    })
  }

  await Promise.all(privKeys.map(async (privKey) => {
    // const publicKey = secp.Point.fromHex(secp.schnorr.getPublicKey(privKey)).toRawBytes()
    const key = secp.getPublicKey(privKey.key)

    const signature = await secp.sign(bundleHash, privKey.key, {
      extraEntropy: true,
    })

    // TODO check if it's was already signed

    signatures.push({
      type: privKey.type,
      source: privKey.source ?? '',
      key,
      signature,
    })
  }))

  const newData: BufferData[] = []

  const {
    addData,
    text,
    Uint16,
    // Uint32,
    withLength,
    chunk,
  } = dataEncoder(newData)

  addData(
    chunk('RIFF', [
      chunk(DDF_BUNDLE_MAGIC, DDFBContent),
      signatures.map(signature =>
        chunk('SIGN',
          [
            text(signature.type),
            withLength(text(signature.source), Uint16),
            withLength(signature.key, Uint16),
            withLength(signature.signature, Uint16),
          ],
        ),
      ),
    ]),
  )

  return new Blob(newData)
}

export async function verify(hash: Uint8Array, publicKey: Uint8Array, signature: Uint8Array): Promise<boolean> {
  return secp.verify(signature, hash, publicKey)
}
