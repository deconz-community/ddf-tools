import type { BundleData } from "./types";
import type { rawData } from "./schema";
import { schema } from "./schema";

export function Bundle() {
  let name = "bundle.ddf";
  const data: BundleData = {
    desc: {
      last_modified: new Date(),
      schema: "devcap1.schema.json",
      vp: [],
    },
    ddfc: {},
    files: [],
  };

  const parseFile = async (file: File) => {
    name = file.name;
    data.files = [];
    const buffer = new Uint8Array(await file.arrayBuffer());
    const rawData: rawData = schema.fromBuffer(buffer as Buffer) as rawData;
    for (const chunk of rawData.ddf.data) {
      switch (chunk.version) {
        case "DESC": {
          data.desc = JSON.parse(chunk.data);
          data.desc.last_modified = new Date(data.desc.last_modified);
          break;
        }
        case "DDFC": {
          data.ddfc = JSON.parse(chunk.data);
          break;
        }

        case "EXTF": {
          data.files.push({
            type: "EXTF.SCJS",
            data: chunk.data,
            last_modified: new Date(chunk.timestamp),
            path: chunk.path.trim().replaceAll("\x00", ""),
          });
          break;
        }
      }
    }
  };

  const makeBundle = async () => {
    const rawData: rawData = {
      identifier: "RIFF",
      size: 0,
      ddf: {
        identifier: "DDFB",
        data: [],
      },
    };

    const strDESC = JSON.stringify(data.desc)
    rawData.ddf.data.push({
      version: "DESC",
      size: strDESC.length,
      data: strDESC,
    });

    const strDDFC = JSON.stringify(data.ddfc)
    rawData.ddf.data.push({
      version: "DDFC",
      size: strDDFC.length,
      data: strDDFC,
    });

    data.files.forEach((file) => {
      rawData.ddf.data.push({
        version: "EXTF",
        pathLength: file.path.length,
        path: file.path + '\x00',
        timestamp: file.last_modified.getTime(),
        size: file.data.length + 1,
        data: file.data as string,
      });
    });

    rawData.size = schema.size(rawData)


    const newBundle = schema.toBuffer(rawData)

    return newBundle
  };

  return { name, parseFile, makeBundle, data };
}
