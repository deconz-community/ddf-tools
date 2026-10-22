import { blob, index, integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const ddfUuids = sqliteTable("ddf_uuids", {
  id: text("id").primaryKey(),
  date_created: text("date_created").notNull(),
  expire_at: text("expire_at"),
  owner_id: text("owner_id"),
});

export const bundles = sqliteTable(
  "bundles",
  {
    id: text("id").primaryKey(),
    ddf_uuid: text("ddf_uuid")
      .notNull()
      .references(() => ddfUuids.id),
    date_created: text("date_created").notNull(),
    source_last_modified: text("source_last_modified").notNull(),
    vendor: text("vendor").notNull(),
    product: text("product").notNull(),
    version_deconz: text("version_deconz").notNull(),
    info: text("info"),
    content: blob("content", { mode: "buffer" }).notNull(),
    content_size: integer("content_size").notNull(),
    file_count: integer("file_count").notNull(),
    content_hash: text("content_hash").notNull(),
    deprecation_message: text("deprecation_message"),
  },
  (table) => [
    index("bundles_ddf_uuid_idx").on(
      table.ddf_uuid,
      table.source_last_modified,
      table.date_created,
    ),
  ],
);

export const deviceIdentifiers = sqliteTable(
  "device_identifiers",
  {
    id: text("id").primaryKey(),
    manufacturer: text("manufacturer").notNull(),
    model: text("model").notNull(),
  },
  (table) => [
    unique("device_identifiers_manufacturer_model_unique").on(table.manufacturer, table.model),
  ],
);

export const bundlesDeviceIdentifiers = sqliteTable(
  "bundles_device_identifiers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    bundles_id: text("bundles_id")
      .notNull()
      .references(() => bundles.id, { onDelete: "cascade" }),
    device_identifiers_id: text("device_identifiers_id")
      .notNull()
      .references(() => deviceIdentifiers.id, { onDelete: "cascade" }),
  },
  (table) => [index("bundles_device_identifiers_bundle_idx").on(table.bundles_id)],
);

export const signatures = sqliteTable(
  "signatures",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull(),
    bundle: text("bundle")
      .notNull()
      .references(() => bundles.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["system", "user"] }).notNull(),
  },
  (table) => [
    index("signatures_bundle_idx").on(table.bundle),
    index("signatures_key_idx").on(table.key),
  ],
);

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  avatarUrl: text("avatar_url"),
  publicKey: text("public_key").unique(),
  privateKey: text("private_key"),
  isContributor: integer("is_contributor", { mode: "boolean" }).notNull().default(false),
  emailVerifiedAt: integer("email_verified_at"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const accountTokens = sqliteTable("account_tokens", {
  id: text("id").primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  purpose: text("purpose", { enum: ["verify_email", "reset_password"] }).notNull(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  windowStartedAt: integer("window_started_at").notNull(),
});

export const apiTokens = sqliteTable(
  "api_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    tokenPrefix: text("token_prefix").notNull(),
    createdAt: integer("created_at").notNull(),
    lastUsedAt: integer("last_used_at"),
    revokedAt: integer("revoked_at"),
  },
  (table) => [index("api_tokens_user_idx").on(table.userId)],
);
