import * as secp from '@noble/secp256k1'

type BufferData = Uint8Array | ArrayBuffer | Blob | BufferData[]

export async function sign(bundled: Blob, privKeys: string[] = []): Promise<Blob> {
  const textEncoder = new TextEncoder()

  const buffer = await bundled.arrayBuffer()
  const bundleHash = await secp.utils.sha256(new Uint8Array(buffer))

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

  return new Blob([
    bundled,
    textEncoder.encode('SIGN'),
    ...signatures.map((signature) => {
      return textEncoder.encode(signature.publicKey + signature.signature)
    }),

  ])
}
