import { z } from "zod";

const environmentSchema = z
  .object({
    DATABASE_PATH: z.string().trim().min(1),
    HOST: z.string().trim().min(1).default("127.0.0.1"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  })
  .transform(({ DATABASE_PATH, HOST, PORT }) => ({
    databasePath: DATABASE_PATH,
    host: HOST,
    port: PORT,
  }));

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
