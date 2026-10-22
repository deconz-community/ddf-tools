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

Errors use { error: { code, message, details? } }.
