FROM node:24-bookworm-slim AS build

RUN apt-get update \
  && apt-get install --yes --no-install-recommends git python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable
WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/store/package.json apps/store/package.json
COPY packages/bundler/package.json packages/bundler/package.json
RUN pnpm install --frozen-lockfile --filter @deconz-community/store-api...

COPY packages/bundler packages/bundler
COPY apps/store apps/store
RUN pnpm --filter @deconz-community/store-api build \
  && pnpm --filter @deconz-community/store-api deploy --prod /production

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV DATABASE_PATH=/data/store.db
ENV AVATAR_PATH=/data/avatars

WORKDIR /app
COPY --from=build --chown=node:node /production ./
COPY --from=build --chown=node:node /workspace/apps/store/dist ./dist
COPY --from=build --chown=node:node /workspace/apps/store/drizzle ./drizzle
RUN mkdir -p /data && chown node:node /data

USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
