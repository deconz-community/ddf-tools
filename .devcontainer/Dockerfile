# See https://github.com/directus/directus/issues/26299 before updating node version

FROM ghcr.io/voidzero-dev/vite-plus:latest

# Shell customization (prompt, aliases) sourced from the vp user's .bashrc
COPY --chown=vp:vp bashrc.sh /home/vp/.devcontainer-bashrc.sh
RUN echo 'source ~/.devcontainer-bashrc.sh' >> /home/vp/.bashrc \
     && chown vp:vp /home/vp/.bashrc

# Toolchain required to compile native modules (isolated-vm, sqlite3 for Directus)
# sqlite3 prebuilt binaries need GLIBC 2.38+, so it is rebuilt from source (see devcontainer.json)
USER root
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
     && apt-get -y install --no-install-recommends python-is-python3 python3 g++ build-essential

USER vp

# [Optional] Uncomment if you want to install an additional version of node using nvm
# ARG EXTRA_NODE_VERSION=10
# RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install ${EXTRA_NODE_VERSION}"

# [Optional] Uncomment if you want to install more global node packages

#RUN su node -c "npm install --location=global pnpm turbo @changesets/cli"
#RUN su node -c "npx playwright install-deps"
#RUN su node -c "npx playwright install chromium"
