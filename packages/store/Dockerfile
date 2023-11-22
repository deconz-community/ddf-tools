
####################################################################################################
## Build Packages

FROM node:18-alpine AS builder
WORKDIR /ddf-tools

ARG TARGETPLATFORM

ENV NODE_OPTIONS=--max-old-space-size=8192

RUN <<EOF
  if [ "$TARGETPLATFORM" = 'linux/arm64' ]; then
  	apk --no-cache add python3 build-base
  	ln -sf /usr/bin/python3 /usr/bin/python
  fi
EOF

COPY package.json .
RUN corepack enable && corepack prepare

COPY pnpm-lock.yaml .
RUN pnpm fetch

COPY . .

RUN <<EOF
  pnpm install --recursive --offline --frozen-lockfile
  pnpm --dir packages/store-extension run build
EOF


####################################################################################################
## Create Production Image

# Use the official Directus image as the base image
FROM directus/directus:10.8.2

WORKDIR /directus

USER root
RUN corepack enable \
  && corepack prepare pnpm@8.7.6 --activate \
  && chown -R node:node /directus

EXPOSE 8055

COPY --from=builder --chown=node:node /ddf-tools/packages/store-extension/dist /ddf-tools/store-extension/dist
COPY --from=builder --chown=node:node /ddf-tools/packages/store-extension/package.json /ddf-tools/store-extension/package.json

USER node
RUN pnpm add /ddf-tools/store-extension


# https://github.com/deconz-community/ddf-tools
# refs/heads/main
# packages/store/docker-compose.yml