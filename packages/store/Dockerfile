
####################################################################################################
## Build Packages

#FROM node:18-alpine AS builder
#WORKDIR /ddf-tools
#
#ENV NODE_OPTIONS=--max-old-space-size=8192
#
#COPY package.json .
#RUN corepack enable && corepack prepare
#
#COPY pnpm-lock.yaml .
#RUN pnpm fetch
#
#COPY . .
#
#RUN <<EOF
#  pnpm install --filter packages/store-extension --recursive --offline --frozen-lockfile
#  pnpm --dir packages/store-extension run build
#EOF


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

USER node

RUN pnpm install @deconz-community/directus-extension-ddf-store

CMD : \
	&& node cli.js bootstrap \
	&& node cli.js schema apply --yes ./schema.yaml \
	&& pm2-runtime start ecosystem.config.cjs \
	;

# https://github.com/deconz-community/ddf-tools
# refs/heads/main
# packages/store/docker-compose.yml