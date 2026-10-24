# HTTP Framework & Typed-Client Export Mechanism (Issue #104)

Research date: 2026-10-22

## Question

Which Node-based framework is the most stable and future-proof choice for a
type-safe REST API backing `apps/store` (SQLite via Drizzle, multipart upload
of binary bundle files, binary file download, session-cookie + Bearer-token
auth), consumed by the Vue 3 `apps/toolbox` app and the `packages/cli`
tool — and how does each option export types so clients can make fully typed
requests (`.d.ts` bundle, OpenAPI-generated client, etc.)?

Scope, per the issue: compare only **Hono** (`hc` RPC client), **Fastify**
(+ zod type provider / OpenAPI client generation), and **oRPC or ts-rest**.

## Summary

**Hono + `hono/client` (`hc<AppType>()`)** is the clear recommendation. It
needs zero codegen — the client imports the server's inferred TypeScript
type directly, which fits this pnpm monorepo (`apps/store` → `packages/rest-client`
→ `apps/toolbox`/`packages/cli`) with no extra build step or spec/
implementation drift risk. It has first-class multipart (`c.req.parseBody()`)
and native `Response`/stream support for binary downloads, flexible
middleware for both cookie and Bearer auth, and the healthiest maintenance
signal of all candidates checked (active releases within the research
window, 4.13.13 → 5.0.0-rc.1).

Within the third family, **ts-rest is effectively unmaintained** (no commits
since 2025-06-02, ~16 months stale as of this research), while **oRPC is very
actively developed** (`1.16.0` shipped the day of this research) — if a
contract-first approach were chosen, oRPC would be the pick, not ts-rest.
Fastify remains the most proven/heaviest-weight production HTTP server but
requires a two-stage OpenAPI-spec-then-codegen pipeline rather than direct
type inference.

## Comparison Table

| | **Hono** (`hc`/`hono/client`) | **Fastify** + zod type-provider + OpenAPI codegen | **oRPC** (contract-based) | **ts-rest** (contract-based) |
|---|---|---|---|---|
| Type-safety mechanism | Direct TS inference: client imports server's `typeof app` (`AppType`) — no codegen | OpenAPI JSON spec generated at runtime/build (`@fastify/swagger`), then a separate codegen tool (`openapi-typescript`/`orval`) turns it into `.d.ts`/client | Shared "contract" package (`@orpc/contract`); procedures built with `oc`/`os` builders; native Standard-Schema (zod) inference | Shared contract package (`initContract().router(...)`), imported by server and client — older variant of the same pattern |
| Codegen required? | **No** ([hono.dev/docs/guides/rpc](https://hono.dev/docs/guides/rpc)) | **Yes** — spec generation + CLI codegen step | **No** ([orpc.dev/docs/contract/procedure](https://orpc.dev/docs/contract/procedure)) | **No** ([ts-rest.com](https://ts-rest.com/)) |
| Multipart upload support | First-class: `c.req.parseBody()` returns typed `(string\|File)`/`(string\|File)[]` fields, with `all`/`dot` options ([hono.dev/docs/api/request](https://hono.dev/docs/api/request)) | First-class via `@fastify/multipart` (`req.file()`, built on `@fastify/busboy`) ([github.com/fastify/fastify-multipart](https://github.com/fastify/fastify-multipart)) | Native `z.file()`/`File`/`Blob` input support | Supported but historically limited — file array support was a late addition and raw `FormData` loses type safety ([ts-rest#571](https://github.com/ts-rest/ts-rest/issues/571)) |
| Binary/stream download | `Response`-native: handlers return any `Response`/stream; client `res` is a Fetch `Response` (`res.blob()`/`res.body`) ([hono.dev/docs/guides/rpc](https://hono.dev/docs/guides/rpc)) | `reply.send(stream)` works; binary response typing needs manual schema annotation, not auto-inferred | Handler can return `File`/`Blob`/stream, typed in the contract output | Supported but weaker binary-typing story; mostly JSON-first design |
| Auth middleware pattern | `app.use()` chain; built-in `basicAuth`/`bearerAuth`/`jwt` middleware, plus custom `createMiddleware()` with typed `c.set()`/`c.var` context ([hono.dev/docs/guides/middleware](https://hono.dev/docs/guides/middleware)) | Hooks (`onRequest`/`preHandler`) + plugins (`fastify-plugin`); mature, well-established, orthogonal to the type provider | `.middleware()` on contract/procedure builder with typed context injection and `ORPCError('UNAUTHORIZED')` ([orpc.dev/docs/middleware](https://orpc.dev/docs/middleware)) | Similar middleware concept, less actively documented/evolved recently |
| Release cadence / maintenance (as of Oct 2026) | Very active: `4.13.13` → `5.0.0-rc.1`, releases every few days; last push 2026-10-17 | Extremely active; core team, releases days apart; last push 2026-10-22 | Extremely active: `1.16.0` published 2026-10-21, weekly cadence | **Stale**: latest stable `3.52.1` published 2025-03-04; last commit of any kind 2025-06-02 (~16 months inactive) |
| GitHub stars (approx) | 32.6k ([honojs/hono](https://github.com/honojs/hono)) | 37.3k ([fastify/fastify](https://github.com/fastify/fastify)) | 5.7k ([current canonical repo, previously unnoq/orpc](https://github.com/middleapi/orpc)) | 3.3k ([ts-rest/ts-rest](https://github.com/ts-rest/ts-rest)) |
| Latest version (npm) | `hono@4.13.13` (2026-10-04); v5 RC in progress | `fastify@5.12.7` (2026-10-13); `@fastify/type-provider-zod@1.0.1`; `@fastify/multipart@10.1.4`; `@fastify/swagger@9.9.2`; `openapi-typescript@7.13.0`; `orval@8.44.0` | `@orpc/server@1.16.0` (2026-10-21) | `@ts-rest/core@3.52.1` (2025-03-04) |
| Key risks | Recently moved to v5 RC — watch generics/strict-mode changes for monorepo RPC inference (`tsconfig strict:true` required, see [honojs/hono#2270](https://github.com/honojs/hono/issues/2270#issuecomment-2143745118)) | zod type-provider is young (`v1.0.1`), API churn possible; codegen pipeline adds a build step and spec/implementation drift risk if forgotten | Has rebranded/moved orgs twice (unnoq → dinwwwh → middleapi) — repo URL churn, though packages/code stable; v2 beta in parallel track | Project appears effectively unmaintained — adopting now is a stability/support risk; multipart typing gaps unlikely to be fixed |
| Drizzle + SQLite examples | No official first-party Hono+Drizzle example found in docs fetched (community examples exist, unverified) | No official first-party Fastify+Drizzle guide found in docs fetched | Not checked in this pass | Not checked in this pass |

## Recommendation

**Adopt Hono + `hono/client` (`hc<AppType>()`) for `apps/store`**, paired
with zod validators (already a dependency per `packages/rest-client`) via
Hono's Standard-Schema/zod validator middleware.

Rationale:

1. **Zero codegen, zero drift** — the client's types come directly from
   `typeof app` exported by the server; in this pnpm workspace it's trivial
   to wire `packages/rest-client` to depend on `apps/store`'s exported route
   types, avoiding manual duplication better than Fastify's spec-generation
   pipeline (extra build step + spec/implementation drift risk).
2. **First-class multipart + streaming** — `c.req.parseBody()` natively
   types `File`/`File[]` fields for bundle uploads, and handlers can return
   any `Response` (including streams) for binary downloads, with the RPC
   client exposing a Fetch-compatible `Response` on the client side.
3. **Both consumers fit naturally** — `apps/toolbox` (Vue 3) and
   `packages/cli` can both import `hc<AppType>` from `packages/rest-client`,
   re-exporting a pre-configured client; no codegen artifacts need to be
   checked in or regenerated per route change.
4. **Healthiest maintenance signal** among all candidates checked at
   research time.
5. oRPC/ts-rest's main selling point — a reusable "contract" consumable by
   future non-TS clients — isn't needed here since both consumers are
   TypeScript/Node; ts-rest specifically should be avoided given its
   ~16-month maintenance gap. oRPC is healthy but adds a contract-package
   indirection layer that Hono's direct type inference avoids for this
   monorepo-only use case.

## How the Hono Typed Client Is Exported (Recommended Approach)

1. In `apps/store`, build the Hono app as a chained route definition and
   export its inferred type:
   ```ts
   const route = app.post('/bundles', zValidator('form', uploadSchema), handler)...
   export type AppType = typeof route
   ```
   ([hono.dev/docs/guides/rpc](https://hono.dev/docs/guides/rpc))
2. In `packages/rest-client`, import `AppType` as a type-only import from
   `apps/store` (via a pnpm workspace dependency) and construct the client:
   ```ts
   import type { AppType } from '@ddf-tools/store'
   import { hc } from 'hono/client'
   export const client = hc<AppType>(baseUrl, {
     init: { credentials: 'include' },
     headers: { Authorization: `Bearer ${token}` },
   })
   ```
3. **Requirements**: both `apps/store/tsconfig.json` and
   `packages/rest-client/tsconfig.json` must have `"strict": true` for
   correct inference ([honojs/hono#2270](https://github.com/honojs/hono/issues/2270#issuecomment-2143745118));
   a TS project reference (or workspace `dependencies` + package resolution)
   from `rest-client` → `store` is required so the *type* (not the runtime
   code) can be imported.
4. **Limitations**: this is monorepo-only — it relies on importing a
   TypeScript type, not a wire-format schema, so it does not work across
   languages or for external third parties. There is no standalone portable
   `.d.ts` publishable to npm for consumption outside the TS compiler graph
   (unlike an OpenAPI spec). If ddf-tools ever needs non-TS consumers, an
   OpenAPI export (via `@hono/zod-openapi`) could be layered on top later
   without abandoning the RPC client.
5. `packages/cli` can depend on the same `rest-client` export, giving it the
   same typed `client.posts.$get(...)` calls with no duplication.

## Gaps and Uncertainties

- No official first-party Hono+Drizzle or Fastify+Drizzle integration guide
  was found in the docs pages fetched; Drizzle+SQLite compatibility is
  framework-agnostic (both just run in Node handlers), so this is a
  non-issue in practice but wasn't separately verified with a dedicated doc
  citation.
- `orpc.dev/docs/openapi/plugins/file-upload-download` and
  `orpc.dev/docs/file` both 404'd during this research; oRPC's file/binary
  docs structure may have been reorganized. The `z.file()`/`File`/`Blob`
  support description above is based on secondary synthesis rather than a
  directly fetched doc page — recommend a follow-up fetch of
  `orpc.dev/docs/binary` or the current sitemap if oRPC is pursued further.
- `ts-rest.com/docs/core/` and `/docs/intro` both 404'd (docs site
  restructured); ts-rest findings rely on the root landing page plus a
  GitHub issue — sufficient to establish the maintenance-risk conclusion,
  not a full feature audit.
