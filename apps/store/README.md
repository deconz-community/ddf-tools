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
defaults to `127.0.0.1`. Configure `ALLOWED_ORIGINS` with a comma-separated
list of toolbox origins. Set both `SMTP_URL` and `SMTP_FROM` to enable email
verification and password-reset messages; without SMTP, new accounts are
verified immediately and the service logs a warning.

Use `pnpm db:generate --name <migration>` to generate a migration from
`src/schema.ts`. Migrations are applied automatically when the service starts.
Run `pnpm check`, `pnpm test`, and `pnpm build` to validate the service.

## Account API

The versioned account API is rooted at `/api/v1`: registration and email
verification use `/auth/register` and `/auth/verify-email`; login and logout use
`/auth/login` and `/auth/logout`; password recovery uses
`/auth/password-reset/request` and `/auth/password-reset/confirm`. The
authenticated profile is available at `/profile`, with public user lookups at
`/users/:id` and `/users/key/:key`. Mutating requests require an allowed
`Origin` and the `X-Store-Request: 1` header. Successful login sets an
HttpOnly server-backed session cookie.

## Docker

From this directory, start the service with:

```sh
docker compose up --build
```

The container listens on port `3000` and stores its SQLite database in the
persistent `store-data` volume mounted at `/data`.

## Configuration

| Variable          | Required | Default                 | Description                             |
| ----------------- | -------- | ----------------------- | --------------------------------------- |
| `DATABASE_PATH`   | Yes      | —                       | SQLite database file path               |
| `HOST`            | No       | `127.0.0.1`             | Interface address to bind               |
| `PORT`            | No       | `3000`                  | HTTP port (1–65535)                     |
| `ALLOWED_ORIGINS` | No       | `http://localhost:4000` | Comma-separated browser origins         |
| `SMTP_URL`        | No       | —                       | Nodemailer SMTP connection URL          |
| `SMTP_FROM`       | No       | —                       | Sender address (required with SMTP_URL) |
| `TOOLBOX_URL`     | No       | `http://localhost:4000` | Base URL used in account emails         |
| `SECURE_COOKIES`  | No       | Production only         | Force the session cookie Secure flag    |
