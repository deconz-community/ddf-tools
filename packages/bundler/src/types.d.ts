export interface BundleData {
  name: string;
  hash?: Uint8Array;
  desc: ChunkDESC;
  ddfc: string;
  files: BundleFile[];
  signatures: ChunkSignature[];
}

export interface ChunkDESC {
  uuid: string;
  version: string;
  version_deconz: string;
  source: string;
  last_modified: Date;
  product: string;
  links?: string[];
  device_identifiers: [string, string][];
}

export type BundleFile = TextFile | BinaryFile;
export type TextFile = JSONFile | ScriptFile | MarkdownFile;

interface FileMeta {
  type: "SCJS" | "JSON" | "BTNM" | "CHLG" | "NOTI" | "NOTW" | "KWIS" | "UBIN" | "IMGP";
  last_modified: Date;
  path: string;
}

export interface JSONFile extends FileMeta {
  type: "JSON" | "BTNM";
  data: string;
}

export interface ScriptFile extends FileMeta {
  type: "SCJS";
  data: string;
}

export interface MarkdownFile extends FileMeta {
  type: "CHLG" | "NOTI" | "NOTW" | "KWIS";
  data: string;
}

export interface BinaryFile extends FileMeta {
  type: "UBIN" | "IMGP";
  data: Blob;
}

export interface ChunkSignature {
  key: Uint8Array;
  signature: Uint8Array;
}
