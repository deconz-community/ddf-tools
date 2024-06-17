####################################################################################################
## Create Production Image

# Use the official Directus image as the base image

FROM directus/directus:10.12.1

USER root
RUN corepack enable && corepack prepare

USER node

# Install the Directus extensions
RUN pnpm install @deconz-community/directus-extension-ddf-store@0.23.0
RUN pnpm install directus-extension-field-actions@1.8.4

# ddf-store
# https://github.com/deconz-community/ddf-tools
# refs/heads/main
# packages/store/docker-compose.yml

# TODO : https://github.com/linuxserver/docker-swag
