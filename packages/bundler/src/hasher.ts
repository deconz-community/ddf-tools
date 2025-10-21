import type { Bundle } from './bundle'
import type { BufferData } from './encoder'
import { sha256 } from '@noble/hashes/sha2.js'
import { dataEncoder, encodeDDFB } from './encoder'

export async function generateHash(data: ReturnType<typeof Bundle>['data']): Promise<Uint8Array> {
  const chunks: BufferData[] = []
  const encoder = dataEncoder(chunks)
  encoder.addData(encodeDDFB(encoder, data))
  const buffer = await (new Blob(chunks).arrayBuffer())
  return sha256(new Uint8Array(buffer))
}
