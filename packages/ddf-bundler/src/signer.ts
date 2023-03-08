import secp from '@noble/secp256k1'

export async function getHash(bundled: File | Blob, startOffset = 8, endOffset = 0): Promise<Uint8Array> {
  const buffer = await bundled.arrayBuffer()
  const bufferToHash = buffer.slice(startOffset, buffer.byteLength - startOffset - endOffset)
  return await secp.utils.sha256(new Uint8Array(bufferToHash))
}

export async function sign(bundled: Blob, privKeys: string[] = []): Promise<Blob> {
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
}

export function verify(hash: Uint8Array, publicKey: string, signature: string): Promise<boolean> {
  return secp.schnorr.verify(signature, hash, publicKey)
}
