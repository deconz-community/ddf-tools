export interface BundleData {
  name: string
  hash?: Uint8Array
  desc: ChunkDESC
  files: BundleFile[]
  validation?: ValidationResult
  signatures: ChunkSignature[]
}

export interface ChunkDESC {
  uuid: string
  version_deconz: string
  last_modified: Date
  vendor: string
  product: string
  links?: string[]
  device_identifiers: [string, string][]
}

export type BundleFile = TextFile // | BinaryFile
export type TextFile = JSONFile | ScriptFile | MarkdownFile

interface FileMeta {
  type: 'SCJS' | 'JSON' | 'DDFC' /* | 'BTNM' */ | 'CHLG' | 'INFO' | 'WARN' | 'KWIS' /* | 'UBIN' | 'IMGP' */
  last_modified?: Date
  path: string
}

export interface JSONFile extends FileMeta {
  type: 'JSON' | 'DDFC' // | 'BTNM'
  data: string
}

export interface ScriptFile extends FileMeta {
  type: 'SCJS'
  data: string
}

export interface MarkdownFile extends FileMeta {
  type: 'CHLG' | 'INFO' | 'WARN' | 'KWIS'
  data: string
}

/*
export interface BinaryFile extends FileMeta {
  type: 'UBIN' | 'IMGP'
  data: Blob
}
*/

export type ValidationError = {
  type: 'simple'
  message: string
  file?: string
} | {
  type: 'code'
  message: string
  file: string
  path: (string | number)[]
  line?: number
  column?: number
}

export type ValidationResult = ({
  result: 'success' | 'skipped'
} | {
  result: 'error'
  errors: ValidationError[]
}) & {
  version: string
}

export interface ChunkSignature {
  key: Uint8Array
  signature: Uint8Array
}
