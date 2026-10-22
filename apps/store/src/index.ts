import { serve } from "@hono/node-server";
import { loadConfig } from "./config.js";
import { openDatabase, runMigrations } from "./database.js";
import { createApp } from "./app.js";

function closeServer(server: ReturnType<typeof serve>, closeDatabase: () => void): void {
  server.close((error) => {
    if (error) {
      console.error("Failed to close the store service cleanly.", error);
      process.exitCode = 1;
    }
    closeDatabase();
  });
}

function start(): void {
  const config = loadConfig();
  const { client, database } = openDatabase(config.databasePath);

  try {
    runMigrations(database);
    const server = serve(
      {
        fetch: createApp(database).fetch,
        hostname: config.host,
        port: config.port,
      },
      (info) => {
        console.info(`Store service listening on http://${info.address}:${info.port}`);
      },
    );
    const shutdown = () => closeServer(server, () => client.close());
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  } catch (error) {
    client.close();
    throw error;
  }
}

try {
  start();
} catch (error) {
  console.error("Store service failed to start.", error);
  process.exitCode = 1;
}
