ARG VARIANT="22-trixie"

FROM mcr.microsoft.com/devcontainers/typescript-node:${VARIANT}

# [Optional] Uncomment this section to install additional OS packages.
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
     && apt-get -y install --no-install-recommends python-is-python3 python3 g++ build-essential

# [Optional] Uncomment if you want to install an additional version of node using nvm
# ARG EXTRA_NODE_VERSION=10
# RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install ${EXTRA_NODE_VERSION}"

# [Optional] Uncomment if you want to install more global node packages
RUN su node -c "npm install --location=global pnpm turbo @changesets/cli isolated-vm"
RUN su node -c "npx playwright install-deps"
RUN su node -c "npx playwright install chromium"
