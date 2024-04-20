####################################################################################################
## Create Production Image

# Use the official Directus image as the base image

FROM directus/directus:10.10.7

USER root
RUN corepack enable && corepack prepare

RUN apk --no-cache add shadow && groupmod --gid 1001 node && usermod --uid 1001 --gid 1001 node && apk del shadow

USER node
RUN pnpm install @deconz-community/directus-extension-ddf-store@0.10.0


# ddf-store
# https://github.com/deconz-community/ddf-tools
# refs/heads/main
# packages/store/docker-compose.yml

# TODO : https://github.com/linuxserver/docker-swag
