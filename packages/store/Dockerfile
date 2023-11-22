
####################################################################################################
## Create Production Image

# Use the official Directus image as the base image
FROM directus/directus:10.8.1

# WORKDIR /directus

# COPY . .

USER root
RUN corepack enable \
&& corepack prepare pnpm@8.7.6 --activate \
&& chown node:node /directus
EXPOSE 8055
USER node
CMD : \
&& node /directus/cli.js bootstrap \
&& node /directus/cli.js start;

