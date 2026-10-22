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
