import { sha256 } from '@noble/hashes/sha256'
import type { Bundle } from './bundle'
import type { BufferData } from './encoder'
import { dataEncoder, encodeDDFB } from './encoder'

export async function generateHash(data: ReturnType<typeof Bundle>['data']) {
  const chunks: BufferData[] = []
  encodeDDFB(dataEncoder(chunks), data)
  const buffer = await (new Blob(chunks).arrayBuffer())
  return sha256(new Uint8Array(buffer))
}
