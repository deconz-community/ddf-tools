####################################################################################################
## Create Production Image

# Use the official Directus image as the base image

FROM directus/directus:11.1.0

USER root
RUN corepack enable && corepack prepare

USER node

# Install the Directus extensions
RUN pnpm install @deconz-community/directus-extension-ddf-store@0.24.1
RUN pnpm install directus-extension-field-actions@1.9.0

# ddf-store
# https://github.com/deconz-community/ddf-tools
# refs/heads/main
# packages/store/docker-compose.yml

# TODO : https://github.com/linuxserver/docker-swag
