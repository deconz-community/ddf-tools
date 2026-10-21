#!/usr/bin/env ts-node

import fs from "node:fs";
import fastGlob from "fast-glob";
import { compile } from "json-schema-to-typescript";
import { toJSONSchema } from "zod";
import { createValidator } from "./dist/ddf-validator.cjs";

const { globSync } = fastGlob;

const genericFiles = globSync("test-data/generic/**/*.json");

const genericFilesData = genericFiles.map((filePath) => {
  const data = fs.readFileSync(filePath, { encoding: "utf-8" });
  const decoded = JSON.parse(data);
  return { path: filePath, data: decoded };
});

genericFilesData.sort((a, b) => {
  if (a.data.schema !== b.data.schema) return a.data.schema.localeCompare(b.data.schema);

  // Reverse the order to load state/airqualityppb before state/airquality
  return b.path.localeCompare(a.path);
});

const generics = {
  attributes: [],
  resources: {},
  manufacturers: {},
  deviceTypes: {},
  subDevices: {},
};

for (const { data } of genericFilesData) {
  switch (data.schema) {
    case "constants1.schema.json":
      Object.assign(generics.manufacturers, data.manufacturers);
      Object.assign(generics.deviceTypes, data["device-types"]);
      break;
    case "constants2.schema.json":
      for (const [key, value] of Object.entries(data)) {
        if (key.startsWith("$MF_")) generics.manufacturers[key] = value;
        else if (key.startsWith("$TYPE_")) generics.deviceTypes[key] = value;
      }
      break;
    case "resourceitem1.schema.json": {
      if (generics.attributes.includes(data.id))
        throw new Error(`Got duplicate resource item with attribute id '${data.id}'.`);

      const { $schema, schema, id, ...resource } = data;
      generics.attributes.push(id);
      generics.resources[id] = resource;
      break;
    }
    case "subdevice1.schema.json":
      generics.subDevices[data.type] = data;
      generics.subDevices[data.name] = data;
      break;
    default:
      throw new Error(`Got invalid generic file, got data with schema '${data.schema}'.`);
  }
}

const validator = createValidator(generics);

const schemaZod = validator.getSchema();
const schemaJSON = toJSONSchema(schemaZod, {
  unrepresentable: "any",
});

// Prepare output dir
const outputDirectory = "./dist";
if (!fs.existsSync(outputDirectory)) fs.mkdirSync(outputDirectory, { recursive: true });

// Write json schema
fs.writeFileSync(
  `${outputDirectory}/ddf-schema.json`,
  JSON.stringify(schemaJSON),
);

const ddfType = await compile(schemaJSON, "DDF", {
  bannerComment: "",
});

const schemaTS = `import { ZodType, ZodError } from "zod";

${ddfType}

export interface GenericsData {
  attributes: string[]
  resources: Record<string, Omit<Extract<DDF, { schema: "resourceitem1.schema.json" }>, 'schema' | 'id'>>
  manufacturers: Record<string, string>
  deviceTypes: Record<string, string>
  subDevices: Record<string, Extract<DDF, { schema: "subdevice1.schema.json" }>>
}

export interface FileDefinition {
  path: string
  data: unknown
}

export type FileDefinitionWithError = FileDefinition & {
  error: ZodError | Error
}

export declare function createValidator(generics?: GenericsData): {
  generics: GenericsData;
  loadGeneric: (data: unknown) => DDF;
  validate: (data: unknown) => DDF;
  getSchema: () => ZodType<DDF>;
  isGeneric: (schema: string) => boolean;
  isDDF: (schema: string) => boolean;
  bulkValidate: (genericFiles: FileDefinition[], ddfFiles: FileDefinition[], callbacks?: {
    onSectionStart?: ((type: 'generic' | 'ddf', total: number) => void) | undefined;
    onSectionProgress?: ((type: 'generic' | 'ddf', current: number, total: number) => void) | undefined;
    onSectionEnd?: ((type: 'generic' | 'ddf', total: number, errors: FileDefinitionWithError[]) => void) | undefined;
}) => FileDefinitionWithError[]
  version: string;
};

export {};
`;

fs.writeFileSync(`${outputDirectory}/ddf-validator.d.ts`, schemaTS);
