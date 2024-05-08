import type { /* BinaryFile, */ JSONFile, MarkdownFile, ScriptFile, TextFile } from './types'

export function asArray<T>(data: T | T[]): T[] {
  return Array.isArray(data) ? data : [data]
}

export function isJSONFileType(type: string): type is JSONFile['type'] {
  // return ['JSON', 'BTNM'].includes(type)
  return type === 'JSON'
}

export function isScriptFileType(type: string): type is ScriptFile['type'] {
  return type === 'SCJS'
}

export function isMarkdownFileType(type: string): type is MarkdownFile['type'] {
  return ['CHLG', 'NOTI', 'NOTW', 'KWIS'].includes(type)
}

export function isTextFileType(type: string): type is TextFile['type'] {
  return isJSONFileType(type) || isScriptFileType(type) || isMarkdownFileType(type)
}
/*
export function isBinaryFileType(type: string): type is BinaryFile['type'] {
  return ['UBIN', 'IMGP'].includes(type)
}
*/

export function isUint8ArrayEqual(first: Uint8Array, second: Uint8Array) {
  return first.length === second.length
    && first.every((value, index) => value === second[index])
}
