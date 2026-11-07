import type { Command } from "@commander-js/extra-typings";
import fs from "node:fs/promises";
import { program } from "@commander-js/extra-typings";
import { setJSONUuid } from "@deconz-community/ddf-bundler";
import { createStoreClient, generateDdfUuids } from "@deconz-community/store-api-client";
import glob from "fast-glob";
import { z } from "zod";

export function bulkCommand() {
  const bulk = program.command("bulk").description("Bulk operations on DDF files.");

  bulkUUIDCommand(bulk);
}

export function bulkUUIDCommand(command: Command) {
  command
    .command("uuid")
    .description("Add missing UUID on DDF file.")
    .argument("<path>", "Source DDF file / directory")
    .option(
      "--store-url <url>",
      "Use a custom store URL instead of the default",
      "https://ddf.cryonet.io",
    )
    .option("--store-token <token>", "Authentication token")
    .action(async (input, options) => {
      const { storeUrl, storeToken } = options;

      // #region Validate options
      if (!storeUrl || !storeToken) {
        console.error("You must provide both --store-url and --store-token");
        return;
      }

      // Generate input file list
      const inputFiles: string[] = [];
      {
        const inputStat = await fs.stat(input);
        if (inputStat.isFile()) {
          inputFiles.push(input);
        } else if (inputStat.isDirectory()) {
          inputFiles.push(...(await glob(`${input}/**/*.json`)));
        } else {
          console.warn("Input must be a file or directory");
          return;
        }
      }

      const minimumSchema = z.object({
        schema: z.string(),
        uuid: z.string().optional(),
      });

      const filesToEdit = (
        await Promise.all(
          inputFiles.map(async (inputFile) => {
            const content = await fs.readFile(inputFile, "utf-8");
            const data = (() => {
              try {
                return minimumSchema.parse(JSON.parse(content));
              } catch {
                console.error(`Invalid DDF file at ${inputFile}`);
                return undefined;
              }
            })();

            if (!data) return;

            if (data.schema !== "devcap1.schema.json") {
              console.log(`Skip file with invalid schema (${data.schema}) at ${inputFile}`);
              return;
            }

            if (data.uuid) {
              console.log(`Skip file with existing UUID (${data.uuid}) at ${inputFile}`);
              return;
            }

            return [inputFile, content];
          }),
        )
      ).filter((data): data is [string, string] => data !== undefined);

      // console.log({ filesToEdit })

      if (filesToEdit.length === 0) {
        console.log("No files to edit.");
        return;
      }

      if (filesToEdit.length > 100) {
        console.error("Too many files to edit. Please limit to 100 files.");
        return;
      }

      const client = createStoreClient({ url: storeUrl, token: storeToken });
      const newUUIDs = await generateDdfUuids(client, filesToEdit.length);

      await Promise.all(
        filesToEdit.map(async ([inputFile, content], index) => {
          const updated = setJSONUuid(content, newUUIDs.uuids[index]);
          // Write the file back
          await fs.writeFile(inputFile, updated);
        }),
      );

      console.log(`${filesToEdit.length} files updated`);
    });
}
