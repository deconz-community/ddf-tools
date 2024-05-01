####################################################################################################
## Create Production Image

# Use the official Directus image as the base image

FROM directus/directus:10.10.7

USER root
RUN corepack enable && corepack prepare

USER node
RUN pnpm install @deconz-community/directus-extension-ddf-store@0.12.1

# ddf-store
# https://github.com/deconz-community/ddf-tools
# refs/heads/main
# packages/store/docker-compose.yml

# TODO : https://github.com/linuxserver/docker-swag
