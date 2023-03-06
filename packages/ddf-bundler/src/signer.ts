import * as secp from '@noble/secp256k1'
import type { Bundle } from './bundle'

type BufferData = Uint8Array | ArrayBuffer | Blob | BufferData[]

export async function getHash(bundled: Blob): Promise<Uint8Array> {
  const view = new DataView(await bundled.arrayBuffer())

  return new Uint8Array()
}

export async function sign(bundled: Blob, privKeys: string[] = []): Promise<Blob> {
  const textEncoder = new TextEncoder()

  const buffer = await bundled.arrayBuffer()
  // Skip the first 8 bytes to start at DDF_BUNDLE_MAGIC
  const bundleHash = await secp.utils.sha256(new Uint8Array(buffer.slice(8)))

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
  view.setUint32(4, view.getUint32(4, true) + 4 + signatures.length * (64 + 128))

  return new Blob([
    bundled,
    textEncoder.encode('SIGN'),
    ...signatures.map((signature) => {
      return textEncoder.encode(signature.publicKey + signature.signature)
    }),

  ])
}

export async function verify(bundle: ReturnType<typeof Bundle>): Promise<boolean> {
  return true
}
