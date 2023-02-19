export interface BundleData {
  name: string
  desc: ChunkDESC;
  ddfc: string;
  files: BundleFile[];
  signatures: ChunkSignature[];
}

export interface ChunkDESC {
  last_modified: Date;
  version?: string;
  "min.deconz"?: string;
  product?: string;
  forum?: string;
  ghissue?: string;
  vp: [string, string][];
}

export type BundleFile = JSONFile | ScriptFile | MarkdownFile | BinaryFile;


export interface JSONFile extends FileMeta {
  type: "BTNM";
  data: string;
}

export interface ScriptFile extends FileMeta {
  type: "SCJS";
  data: string;
}

export interface MarkdownFile extends FileMeta {
  type: "CHLG" | "NOTE" | "KWIS";
  data: string;
}

export interface BinaryFile extends FileMeta {
  type: "UBIN";
  data: DataView;
}

interface FileMeta {
  last_modified: Date;
  path: string;
}

export interface ChunkSignature {
  key: string[32];
  signature: string[64];
}

export interface Signature {
  key: string;
  signature: string;
}
