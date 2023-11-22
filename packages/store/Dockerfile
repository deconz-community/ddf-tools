
####################################################################################################
## Create Production Image

# Use the official Directus image as the base image
# FROM directus/directus:10.8.2
FROM ubuntu AS builder

# WORKDIR /directus

COPY . ./ddf-tools

# USER root
# RUN corepack enable \
# && corepack prepare pnpm@8.7.6 --activate \
# && chown node:node /directus
# EXPOSE 8055
# USER node
# 
# 
# CMD : \
# && node /directus/cli.js bootstrap \
# && node /directus/cli.js start;
# 

# https://github.com/deconz-community/ddf-tools
# refs/heads/main
# packages/store/docker-compose.yml