export interface BundleData {
  name: string;
  desc: ChunkDESC;
  ddfc: string;
  files: BundleFile[];
  signatures: ChunkSignature[];
}

export interface ChunkDESC {
  last_modified: Date;
  version?: string;
  version_deconz?: string;
  product?: string;
  links?: string[];
  device_identifiers: [string, string][];
}

export type BundleFile = StringFile | BinaryFile;
export type StringFile = JSONFile | ScriptFile | MarkdownFile;

interface FileMeta {
  format: "javascript" | "json" | "markdown" | "binary";
  type: "SCJS" | "BTNM" | "CHLG" | "NOTI" | "NOTW" | "KWIS" | "UBIN" | "IMGP";
  last_modified: Date;
  path: string;
}

export interface JSONFile extends FileMeta {
  type: "BTNM";
  format: "json";
  data: string;
}

export interface ScriptFile extends FileMeta {
  type: "SCJS";
  format: "javascript";
  data: string;
}

export interface MarkdownFile extends FileMeta {
  type: "CHLG" | "NOTI" | "NOTW" | "KWIS";
  format: "markdown";
  data: string;
}

export interface BinaryFile extends FileMeta {
  type: "UBIN" | "IMGP";
  format: "binary";
  data: Blob;
}

export interface ChunkSignature {
  key: string[32];
  signature: string[64];
}
