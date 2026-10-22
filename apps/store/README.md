# Store service

Standalone Node.js service for the DDF store. It validates configuration at
startup, applies the committed Drizzle migrations, and exposes `GET /health`.

## Local development

Copy `.env.example` to `.env`, then run:

```sh
pnpm install
pnpm dev
```

The service listens on `HOST` and `PORT`. `DATABASE_PATH` is required; its
parent directory is created when needed. `PORT` defaults to `3000` and `HOST`
defaults to `127.0.0.1`.
Configure `ALLOWED_ORIGINS` with a comma-separated list of toolbox origins. Set
both `SMTP_URL` and `SMTP_FROM` to enable verification and password-reset email;
without SMTP, account registration skips verification and logs a warning.

Use `pnpm db:generate --name <migration>` to generate a migration from
`src/schema.ts`. Migrations are applied automatically when the service starts.
Run `pnpm check`, `pnpm test`, and `pnpm build` to validate the service.

## Docker

From this directory, start the service with:

```sh
docker compose up --build
```

The container listens on port `3000` and stores its SQLite database in the
persistent `store-data` volume mounted at `/data`.

## Configuration

| Variable        | Required | Default     | Description               |
| --------------- | -------- | ----------- | ------------------------- |
| `DATABASE_PATH` | Yes      | —           | SQLite database file path |
| `HOST`          | No       | `127.0.0.1` | Interface address to bind |
| `PORT`          | No       | `3000`      | HTTP port (1–65535)       |
| `ALLOWED_ORIGINS` | No      | `http://localhost:4000` | Comma-separated browser origins         |
| `SMTP_URL`        | No      | —                       | Nodemailer SMTP connection URL          |
| `SMTP_FROM`       | No      | —                       | Sender address (required with SMTP_URL) |
| `TOOLBOX_URL`     | No      | `http://localhost:4000` | Base URL used in account emails         |
| `SECURE_COOKIES`  | No      | Production only         | Force the session cookie Secure flag    |
| `BETA_PRIVATE_KEY` | No      | —                       | 32-byte hex key for contributor beta signing |
| `STABLE_PRIVATE_KEY` | No    | —                       | 32-byte hex key for contributor stable signing |
| `DEPRECATED_PRIVATE_KEY` | No | —                       | 32-byte hex key for the system deprecated signature |

## Account API

The versioned API, including account routes, is rooted at `/v1`: registration and verification
use `/auth/register` and `/auth/verify-email`; login/logout use `/auth/login`
and `/auth/logout`; password recovery uses `/auth/password-reset/request` and
`/auth/password-reset/confirm`. The authenticated profile is at `/profile`, and
public user lookups are at `/users/:id` and `/users/key/:key`. Mutating requests
require an allowed `Origin` and `X-Store-Request: 1`. Login sets an HttpOnly
server-backed session cookie.

## Public bundle API

- `GET /v1/bundles`: latest bundle per DDF UUID, newest first (source_last_modified, then
  date_created). Query: page, limit (max 20), vendor, product, manufacturer, model
  (case-insensitive substring), has_key (exact signature key), show_deprecated (true to include
  deprecated bundles). Filters apply to the latest bundle only. Returns
  { items, total_count, page, limit } with Cache-Control: no-store.
- `GET /v1/bundles/:id/download`: the stored DDB bytes, with immutable cache headers.
- `POST /v1/ddf-uuids`: authenticated JSON `{ "count": 1 }` through `{ "count": 100 }`.
  Returns the reserved UUIDs and their expiry, 21 days after creation.
- `POST /v1/bundles`: authenticated multipart form with one or more `files` fields and an
  optional `state` field (`alpha` by default), up to 100 files per request. Returns a typed
  success or error for each file.
  Uploads validate regenerated DESC, hashes, signatures, and the uploader keypair. Unknown UUIDs
  become owned by the uploader; existing UUIDs can only be updated by their owner or a contributor.
  Beta and stable uploads require a contributor and the corresponding server signing key.

Contributor accounts are marked by a trusted administrator through the `users.is_contributor`
field. Configure beta/stable signing secrets with the corresponding environment variables above;
the service verifies each secret matches the built-in system public key before signing.

## Bundle lifecycle API

- `POST /v1/bundles/:id/signatures`: authenticated JSON `{ "state": "alpha" | "beta" | "stable" }`.
  Contributors can add beta/stable system signatures or remove both system state signatures by
  setting `alpha`. Beta and stable states require their configured private signing key.
- `POST /v1/bundles/:id/deprecate`: authenticated JSON `{ "message": "..." }` or
  `{ "message": null }`. Messages must contain at least 10 characters. Owners of the bundle's DDF
  UUID and contributors can change deprecation. Setting a message adds the system deprecated
  signature; setting `null` removes it. Configure `DEPRECATED_PRIVATE_KEY` for additions. The
  service verifies each configured secret matches its system public key.

Errors use { error: { code, message, details? } }.
