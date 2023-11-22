
####################################################################################################
## Build Packages

FROM node:18-alpine AS builder
WORKDIR /ddf-tools

RUN apk update && apk add bash

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


#RUN <<EOF
#	pnpm install --recursive --offline --frozen-lockfile
#	npm_config_workspace_concurrency=1 pnpm run build
#	pnpm --filter directus deploy --prod dist
#	cd dist
#	# Regenerate package.json file with essential fields only
#	# (see https://github.com/directus/directus/issues/20338)
#	node -e '
#		const f = "package.json", {name, version, type, exports, bin} = require(`./${f}`), {packageManager} = require(`../${f}`);
#		fs.writeFileSync(f, JSON.stringify({name, version, type, exports, bin, packageManager}, null, 2));
#	'
#	mkdir -p database extensions uploads
#EOF


####################################################################################################
## Create Production Image

# Use the official Directus image as the base image
# FROM directus/directus:10.8.2
# FROM ubuntu AS runtime

# WORKDIR /directus



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