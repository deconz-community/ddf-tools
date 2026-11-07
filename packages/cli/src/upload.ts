import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { Command, program } from "@commander-js/extra-typings";
import {
  createStoreClient,
  uploadBundles,
  type StoreUploadState,
} from "@deconz-community/store-api-client";
import glob from "fast-glob";

const defaultStoreUrl = "https://ddf.cryonet.io";
const uploadBatchSize = 100;

export interface UploadCommandDependencies {
  fetch?: typeof fetch;
  readFile?: (path: string) => Promise<Uint8Array>;
  out?: (message: string) => void;
  error?: (message: string) => void;
}

interface UploadOptions {
  storeUrl: string;
  storeToken?: string;
  state: StoreUploadState;
}

export async function uploadBundlePaths(
  input: string,
  options: UploadOptions,
  recursive = false,
  dependencies: UploadCommandDependencies = {},
) {
  const out = dependencies.out ?? console.log;
  const reportError = dependencies.error ?? console.error;
  if (!options.storeToken) {
    reportError("You must provide --store-token to upload bundles.");
    return { uploaded: 0, failed: 1 };
  }

  let files: string[];
  try {
    const stat = await fs.stat(input);
    if (stat.isFile()) files = [input];
    else if (stat.isDirectory() && recursive) {
      files = await glob("**/*.ddb", {
        cwd: input,
        absolute: true,
        caseSensitiveMatch: false,
      });
    } else {
      reportError(
        recursive ? "Input must be a DDB file or directory." : "Input must be a DDB file.",
      );
      return { uploaded: 0, failed: 1 };
    }
  } catch {
    reportError(`Input does not exist: ${input}`);
    return { uploaded: 0, failed: 1 };
  }

  files.sort((left, right) => left.localeCompare(right));
  if (files.length === 0) {
    reportError(`No DDB files found in ${input}.`);
    return { uploaded: 0, failed: 1 };
  }

  const client = createStoreClient({
    url: options.storeUrl,
    token: options.storeToken,
    fetch: dependencies.fetch,
  });
  let uploaded = 0;
  let failed = 0;
  for (let offset = 0; offset < files.length; offset += uploadBatchSize) {
    const batch = files.slice(offset, offset + uploadBatchSize);
    const uploadable: Array<{ name: string; content: Blob }> = [];
    for (const filePath of batch) {
      try {
        uploadable.push({
          name: path.basename(filePath),
          content: new Blob([await (dependencies.readFile ?? fs.readFile)(filePath)]),
        });
      } catch (error) {
        failed++;
        reportError(
          `${path.basename(filePath)} failed to read: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    if (uploadable.length === 0) continue;

    try {
      const result = await uploadBundles(client, uploadable, options.state);
      for (const file of result.results) {
        if (file.success) {
          uploaded++;
          const downloadUrl = new URL(
            `v1/bundles/${encodeURIComponent(file.id)}/download`,
            options.storeUrl,
          );
          out(`${file.file} uploaded successfully (${options.state}): ${downloadUrl.toString()}`);
        } else {
          failed++;
          reportError(`${file.file} failed to upload: ${file.error.code} - ${file.error.message}`);
        }
      }
    } catch (error) {
      failed += uploadable.length;
      reportError(
        `Upload request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return { uploaded, failed };
}

function addUploadOptions(command: Command) {
  return command
    .argument("<path>", "DDB bundle file or directory")
    .option("--store-url <url>", "Store API URL", defaultStoreUrl)
    .option("--store-token <token>", "Store API token")
    .option("--state <state>", "Upload state (alpha, beta, stable)", "alpha");
}

export function registerUploadCommands(
  root: Command = program,
  dependencies: UploadCommandDependencies = {},
) {
  const single = new Command("upload");
  addUploadOptions(single)
    .description("Upload one DDB bundle.")
    .action(async (input, options) => {
      const result = await uploadBundlePaths(
        input,
        { ...options, state: options.state as StoreUploadState },
        false,
        dependencies,
      );
      if (result.failed > 0) process.exitCode = 1;
    });
  root.addCommand(single);

  let bulk = root.commands.find((command) => command.name() === "bulk") as Command | undefined;
  if (!bulk) {
    bulk = new Command("bulk");
    bulk.description("Bulk operations on DDF files.");
    root.addCommand(bulk);
  }
  const bulkUpload = new Command("upload");
  addUploadOptions(bulkUpload)
    .description("Upload DDB bundles from a file or directory.")
    .action(async (input, options) => {
      const result = await uploadBundlePaths(
        input,
        { ...options, state: options.state as StoreUploadState },
        true,
        dependencies,
      );
      if (result.failed > 0) process.exitCode = 1;
    });
  bulk.addCommand(bulkUpload);
}
