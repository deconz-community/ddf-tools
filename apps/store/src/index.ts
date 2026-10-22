import { serve } from "@hono/node-server";
import nodemailer from "nodemailer";
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
  const mailer =
    config.smtpUrl && config.smtpFrom
      ? (() => {
          const transporter = nodemailer.createTransport(config.smtpUrl);
          return {
            async sendVerification(email: string, token: string) {
              const link = `${config.toolboxUrl}/#/store/user/me/register?token=${encodeURIComponent(token)}`;
              await transporter.sendMail({
                from: config.smtpFrom,
                to: email,
                subject: "Verify your DDF Store account",
                text: `Verify your email address: ${link}`,
                html: `<p>Verify your email address by <a href="${link}">opening this link</a>.</p>`,
              });
            },
            async sendPasswordReset(email: string, token: string) {
              const link = `${config.toolboxUrl}/#/store/user/me/password-reset?token=${encodeURIComponent(token)}`;
              await transporter.sendMail({
                from: config.smtpFrom,
                to: email,
                subject: "Reset your DDF Store password",
                text: `Reset your password: ${link}`,
                html: `<p>Reset your password by <a href="${link}">opening this link</a>.</p>`,
              });
            },
          };
        })()
      : undefined;

  try {
    runMigrations(database);
    const server = serve(
      {
        fetch: createApp(database, {
          allowedOrigins: config.allowedOrigins,
          mailer,
          secureCookies: config.secureCookies,
        }).fetch,
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
