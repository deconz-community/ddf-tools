export interface BundleData {
  desc: ChunkDESC
  ddfc: ChunkDDFC
  files?: BundleFile[]
  signature?: ChunkSignature
}

export interface ChunkDESC {
  last_modified: Date
  version: string
  'min.deconz': string
  schema: 'devcap1.schema.json'
  product: string
  forum?: string
  ghissue?: string
  vp: [string, string][]
}

export type ChunkDDFC = Record<string, unknown>

export type BundleFile = JSONFile | ScriptFile | MarkdownFile | BinaryFile

export interface JSONFile extends FileMeta {
  type: 'DESC' | 'DFFC'
  data: string
}

export interface ScriptFile extends FileMeta {
  type: 'EXTF.SCJS'
  data: string
}

export interface MarkdownFile extends FileMeta {
  type: 'EXTF.CHLG' | 'EXTF.NOTE'
  data: string
}

export interface BinaryFile extends FileMeta {
  type: 'EXTF.UBIN'
  data: DataView
}

interface FileMeta {
  last_modified: Date
  path: string
}

export interface ChunkSignature {
  public_key: string[32]
  signature: string[64]
}

export interface Signature {
  key: string
  signature: string
}
