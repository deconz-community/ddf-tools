import type { /* BinaryFile, */ JSONFile, MarkdownFile, ScriptFile, TextFile } from "./types";

export function asArray<T>(data: T | T[]): T[] {
  return Array.isArray(data) ? data : [data];
}

export function isJSONFileType(type: string): type is JSONFile["type"] {
  return ["JSON", "DDFC" /* , 'BTNM' */].includes(type);
}

export function isScriptFileType(type: string): type is ScriptFile["type"] {
  return type === "SCJS";
}

export function isMarkdownFileType(type: string): type is MarkdownFile["type"] {
  return ["CHLG", "INFO", "WARN", "KWIS"].includes(type);
}

export function isTextFileType(type: string): type is TextFile["type"] {
  return isJSONFileType(type) || isScriptFileType(type) || isMarkdownFileType(type);
}
/*
export function isBinaryFileType(type: string): type is BinaryFile['type'] {
  return ['UBIN', 'IMGP'].includes(type)
}
*/

export function isUint8ArrayEqual(first: Uint8Array, second: Uint8Array) {
  return first.length === second.length && first.every((value, index) => value === second[index]);
}

/**
 * Set the `uuid` of a DDF JSON document by editing the source text, so the existing
 * formatting is preserved. When missing, it is added on a new line after the `schema` line.
 */
export function setJSONUuid(source: string, uuid: string): string {
  const existing = /("uuid"\s*:\s*)"[^"]*"/;
  if (existing.test(source)) return source.replace(existing, (_, key) => `${key}"${uuid}"`);

  const schemaLine = /^([ \t]*)"schema"([ \t]*:[ \t]*)"[^"\n]*",[ \t]*(?=\r?$)/m.exec(source);
  if (!schemaLine) throw new Error('Unable to add the uuid, no "schema" line found');

  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  const end = schemaLine.index + schemaLine[0].length;
  const line = `${schemaLine[1]}"uuid"${schemaLine[2]}"${uuid}",`;
  return source.slice(0, end) + eol + line + source.slice(end);
}
