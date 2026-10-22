import { z } from "zod";

const environmentSchema = z
  .object({
    DATABASE_PATH: z.string().trim().min(1),
    HOST: z.string().trim().min(1).default("127.0.0.1"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    CORS_ORIGINS: z.string().default("http://localhost:4000"),
    SMTP_URL: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().trim().min(1).optional(),
    ),
    SMTP_FROM: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().trim().email().optional(),
    ),
    TOOLBOX_URL: z.string().url().default("http://localhost:4000"),
    SECURE_COOKIES: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.enum(["true", "false"]).optional(),
    ),
    BETA_PRIVATE_KEY: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z
        .string()
        .regex(/^[\da-f]{64}$/i)
        .optional(),
    ),
    STABLE_PRIVATE_KEY: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z
        .string()
        .regex(/^[\da-f]{64}$/i)
        .optional(),
    ),
    DEPRECATED_PRIVATE_KEY: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z
        .string()
        .regex(/^[\da-f]{64}$/i)
        .optional(),
    ),
    NODE_ENV: z.string().optional(),
  })
  .refine(({ SMTP_URL, SMTP_FROM }) => Boolean(SMTP_URL) === Boolean(SMTP_FROM), {
    message: "SMTP_URL and SMTP_FROM must be configured together",
  })
  .transform(
    ({
      DATABASE_PATH,
      HOST,
      PORT,
      CORS_ORIGINS,
      SMTP_URL,
      SMTP_FROM,
      TOOLBOX_URL,
      SECURE_COOKIES,
      BETA_PRIVATE_KEY,
      STABLE_PRIVATE_KEY,
      DEPRECATED_PRIVATE_KEY,
      NODE_ENV,
    }) => ({
      databasePath: DATABASE_PATH,
      host: HOST,
      port: PORT,
      allowedOrigins: CORS_ORIGINS.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
      smtpUrl: SMTP_URL,
      smtpFrom: SMTP_FROM,
      toolboxUrl: TOOLBOX_URL.replace(/\/+$/, ""),
      secureCookies:
        SECURE_COOKIES === "true" || (SECURE_COOKIES === undefined && NODE_ENV === "production"),
      betaPrivateKey: BETA_PRIVATE_KEY,
      stablePrivateKey: STABLE_PRIVATE_KEY,
      deprecatedPrivateKey: DEPRECATED_PRIVATE_KEY,
    }),
  );

export type ServiceConfig = z.infer<typeof environmentSchema>;

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): ServiceConfig {
  const result = environmentSchema.safeParse(environment);
  if (!result.success) {
    const issues = result.error.issues
      .map(({ path, message }) => `${path.join(".")}: ${message}`)
      .join("; ");
    throw new Error(`Invalid store service configuration: ${issues}`);
  }

  return result.data;
}
