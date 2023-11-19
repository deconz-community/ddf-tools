# Use the official Directus image as the base image
FROM directus/directus:10.8.1

USER root
RUN corepack enable
USER node

COPY . .

RUN pnpm install ./packages/store-extension
