#!/usr/bin/env bash
# ddf-store.sh - install and operate the DDF store service on a Docker host.
#
# This file is self-contained: download it alone on the server and run
# `./ddf-store.sh install`. The image is built from an embedded Dockerfile that
# git-clones the repository, so no checkout is needed on the host.
#
#   curl -fsSLo ddf-store.sh https://raw.githubusercontent.com/deconz-community/ddf-tools/main/apps/store/scripts/ddf-store.sh
#   chmod +x ddf-store.sh && ./ddf-store.sh install
#
# Requirements: bash, docker. git is optional (used to detect new commits).
set -euo pipefail

SCRIPT_URL="https://raw.githubusercontent.com/deconz-community/ddf-tools/main/apps/store/scripts/ddf-store.sh"
SCRIPT_PATH="$(readlink -f "${BASH_SOURCE[0]}")"

# Everything the script manages lives in this directory (override with DDF_STORE_HOME):
#   ddf-store.conf  script settings (port, repository, ...)
#   store.env       environment passed to the container (SMTP, signing keys, ...)
#   data/           SQLite database and avatars, mounted at /data
#   backups/        cold backups (tar.gz)
HOME_DIR="${DDF_STORE_HOME:-$(dirname "$SCRIPT_PATH")}"
CONF_FILE="$HOME_DIR/ddf-store.conf"
ENV_FILE="$HOME_DIR/store.env"
DATA_DIR="$HOME_DIR/data"
BACKUP_DIR="$HOME_DIR/backups"

# Settings exported by the caller win over ddf-store.conf (snapshot taken before the defaults).
SETTING_KEYS=(CONTAINER IMAGE REPO_URL REPO_REF STORE_BIND STORE_PORT BACKUP_KEEP)
declare -A CALLER_SETTINGS=()
for _key in "${SETTING_KEYS[@]}"; do
  if [[ -n "${!_key+x}" ]]; then CALLER_SETTINGS[$_key]="${!_key}"; fi
done

# Defaults; ddf-store.conf then the caller's environment override them.
CONTAINER="${CONTAINER:-ddf-store}"
IMAGE="${IMAGE:-ddf-store:latest}"
REPO_URL="${REPO_URL:-https://github.com/deconz-community/ddf-tools}"
REPO_REF="${REPO_REF:-main}"
STORE_BIND="${STORE_BIND:-127.0.0.1}"
STORE_PORT="${STORE_PORT:-3000}"
BACKUP_KEEP="${BACKUP_KEEP:-0}" # number of backups to keep, 0 keeps them all
NODE_UID=1000                   # uid/gid of the `node` user inside the image

# ---------------------------------------------------------------------------
# Embedded Dockerfile
# ---------------------------------------------------------------------------
# Keep the build/runtime steps in sync with apps/store/Dockerfile. The only
# difference is that the sources come from `git clone` instead of the build context.
dockerfile() {
  cat <<'DOCKERFILE'
FROM node:24-bookworm-slim AS source
RUN apt-get update \
  && apt-get install --yes --no-install-recommends git ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ARG REPO_URL
ARG REPO_REF=main
# Changes on every new upstream commit so the clone is never served from the cache.
ARG REPO_COMMIT=unknown
RUN echo "Cloning ${REPO_URL}@${REPO_REF} (${REPO_COMMIT})" \
  && git clone --depth 1 --branch "${REPO_REF}" "${REPO_URL}" /source \
  && git -C /source rev-parse HEAD > /source-commit

FROM node:24-bookworm-slim AS build
RUN apt-get update \
  && apt-get install --yes --no-install-recommends git python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /workspace

# Only the manifests are copied first, so dependencies stay cached until they change.
COPY --from=source /source/package.json /source/pnpm-lock.yaml /source/pnpm-workspace.yaml ./
COPY --from=source /source/apps/store/package.json apps/store/package.json
COPY --from=source /source/packages/bundler/package.json packages/bundler/package.json
RUN pnpm install --frozen-lockfile --filter @deconz-community/ddf-store...

COPY --from=source /source/packages/bundler packages/bundler
COPY --from=source /source/apps/store apps/store
RUN pnpm --filter @deconz-community/ddf-store build \
  && pnpm --filter @deconz-community/ddf-store deploy --prod /production

FROM node:24-bookworm-slim AS runtime
ARG REPO_URL
ARG REPO_REF=main
ARG REPO_COMMIT=unknown
LABEL org.opencontainers.image.source="${REPO_URL}" \
      org.opencontainers.image.revision="${REPO_COMMIT}" \
      org.opencontainers.image.version="${REPO_REF}"

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV DATABASE_PATH=/data/store.db
ENV AVATAR_PATH=/data/avatars

WORKDIR /app
COPY --from=build --chown=node:node /production ./
COPY --from=build --chown=node:node /workspace/apps/store/dist ./dist
COPY --from=build --chown=node:node /workspace/apps/store/drizzle ./drizzle
RUN mkdir -p /data && chown node:node /data

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
DOCKERFILE
}

env_template() {
  cat <<'ENVFILE'
# Environment of the DDF store container (docker --env-file format: KEY=value,
# no quotes). Run `./ddf-store.sh recreate` after editing for changes to apply.
# HOST, PORT, DATABASE_PATH and AVATAR_PATH are set by the image; do not set them here.

# Public URL of the toolbox, used in account emails, and the origins allowed by CORS.
TOOLBOX_URL=http://localhost:4000
CORS_ORIGINS=http://localhost:4000

# Set both to enable verification and password-reset email delivery.
SMTP_URL=
SMTP_FROM=

# Defaults to true (production). Set to false only when served over plain HTTP.
SECURE_COOKIES=

# System signing keys (generate with: ./ddf-store.sh cli system-key:generate <beta|stable|deprecated>).
BETA_PRIVATE_KEY=
STABLE_PRIVATE_KEY=
DEPRECATED_PRIVATE_KEY=
ENVFILE
}

conf_template() {
  cat <<CONF
# Settings of ddf-store.sh (sourced by bash). Run \`./ddf-store.sh recreate\` after changing the port.

# Address and port published on the host. Keep 127.0.0.1 when a reverse proxy
# (nginx, caddy, ...) terminates HTTPS; use 0.0.0.0 to expose the store directly.
STORE_BIND=$STORE_BIND
STORE_PORT=$STORE_PORT

# Repository and branch/tag cloned when building the image.
REPO_URL=$REPO_URL
REPO_REF=$REPO_REF

# Number of backups to keep after each backup, 0 keeps them all.
BACKUP_KEEP=$BACKUP_KEEP
CONF
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33mwarning:\033[0m %s\n' "$*" >&2; }
die() {
  printf '\033[1;31merror:\033[0m %s\n' "$*" >&2
  exit 1
}

load_conf() {
  local key
  if [[ -f "$CONF_FILE" ]]; then
    # shellcheck disable=SC1090
    source "$CONF_FILE"
  fi
  for key in "${!CALLER_SETTINGS[@]}"; do printf -v "$key" '%s' "${CALLER_SETTINGS[$key]}"; done
}

need_docker() {
  command -v docker >/dev/null 2>&1 || die "docker is not installed or not in PATH."
  docker info >/dev/null 2>&1 || die "cannot reach the docker daemon (is it running, and is your user in the docker group?)."
}

container_exists() { docker container inspect "$CONTAINER" >/dev/null 2>&1; }
container_running() { [[ "$(docker container inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null || true)" == "true" ]]; }
image_exists() { docker image inspect "$IMAGE" >/dev/null 2>&1; }
image_commit() { docker image inspect -f '{{ index .Config.Labels "org.opencontainers.image.revision" }}' "$IMAGE" 2>/dev/null || true; }

require_installed() {
  container_exists || die "container '$CONTAINER' does not exist. Run: $0 install"
}

confirm() {
  local answer
  if [[ ! -t 0 ]]; then die "$1 Re-run with --yes to confirm."; fi
  read -r -p "$1 [y/N] " answer
  [[ "$answer" == "y" || "$answer" == "Y" ]]
}

# env_set FILE KEY VALUE: replaces `KEY=...` in FILE, or appends it.
env_set() {
  local file="$1" key="$2" value="$3" tmp
  tmp="$(mktemp)"
  if grep -q "^$key=" "$file"; then
    KEY="$key" VALUE="$value" awk -F= '$1 == ENVIRON["KEY"] { print ENVIRON["KEY"] "=" ENVIRON["VALUE"]; next } { print }' "$file" >"$tmp"
  else
    cat "$file" >"$tmp"
    printf '%s=%s\n' "$key" "$value" >>"$tmp"
  fi
  cat "$tmp" >"$file"
  rm -f "$tmp"
}

# Runs a command as root inside the store image with the data/backup dirs mounted.
# Avoids depending on any other image and keeps file ownership under control.
run_helper() {
  docker run --rm --user root --entrypoint "$1" \
    -v "$DATA_DIR:/data" -v "$BACKUP_DIR:/backups" \
    "$IMAGE" "${@:2}"
}

fix_permissions() {
  mkdir -p "$DATA_DIR" "$BACKUP_DIR"
  run_helper chown -R "$NODE_UID:$NODE_UID" /data
}

resolve_remote_commit() {
  # Prints the commit REPO_REF points to, or nothing if git/network is unavailable.
  command -v git >/dev/null 2>&1 || return 0
  GIT_TERMINAL_PROMPT=0 git ls-remote "$REPO_URL" "$REPO_REF" "refs/tags/$REPO_REF^{}" 2>/dev/null | awk 'END { print $1 }' || true
}

build_image() {
  local commit="$1" context
  context="$(mktemp -d)"
  log "Building $IMAGE from $REPO_URL@$REPO_REF (${commit:0:12})"
  # The Dockerfile comes from stdin and the context is an empty directory: nothing is read from the host.
  if ! dockerfile | docker build \
    --file - \
    --tag "$IMAGE" \
    --build-arg "REPO_URL=$REPO_URL" \
    --build-arg "REPO_REF=$REPO_REF" \
    --build-arg "REPO_COMMIT=$commit" \
    "$context"; then
    rm -rf "$context"
    die "image build failed."
  fi
  rm -rf "$context"
}

create_container() {
  [[ -f "$ENV_FILE" ]] || die "$ENV_FILE is missing. Run: $0 install"
  mkdir -p "$DATA_DIR" "$BACKUP_DIR"
  fix_permissions
  log "Creating container $CONTAINER (${STORE_BIND}:${STORE_PORT} -> 3000)"
  docker create \
    --name "$CONTAINER" \
    --restart unless-stopped \
    --publish "${STORE_BIND}:${STORE_PORT}:3000" \
    --env-file "$ENV_FILE" \
    --env LANG=C.UTF-8 --env LC_ALL=C.UTF-8 \
    --volume "$DATA_DIR:/data" \
    "$IMAGE" >/dev/null
}

remove_container() {
  if container_exists; then
    docker rm --force "$CONTAINER" >/dev/null
  fi
}

wait_healthy() {
  local status i
  for ((i = 0; i < 60; i++)); do
    status="$(docker container inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$CONTAINER" 2>/dev/null || true)"
    case "$status" in
      healthy) return 0 ;;
      unhealthy) return 1 ;;
    esac
    container_running || return 1
    sleep 1
  done
  return 1
}

start_and_wait() {
  docker start "$CONTAINER" >/dev/null
  if wait_healthy; then
    log "Store is healthy on http://${STORE_BIND}:${STORE_PORT}"
  else
    warn "the store did not become healthy in time. Last logs:"
    docker logs --tail 30 "$CONTAINER" >&2 || true
    return 1
  fi
}

stop_container() {
  if container_running; then
    log "Stopping $CONTAINER"
    docker stop "$CONTAINER" >/dev/null
  fi
}

# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------
cmd_install() {
  local toolbox_url="" force_conf=0
  while (($#)); do
    case "$1" in
      --port) STORE_PORT="${2:?--port needs a value}"; force_conf=1; shift 2 ;;
      --bind) STORE_BIND="${2:?--bind needs a value}"; force_conf=1; shift 2 ;;
      --ref) REPO_REF="${2:?--ref needs a value}"; force_conf=1; shift 2 ;;
      --repo) REPO_URL="${2:?--repo needs a value}"; force_conf=1; shift 2 ;;
      --toolbox-url) toolbox_url="${2:?--toolbox-url needs a value}"; shift 2 ;;
      *) die "unknown option for install: $1" ;;
    esac
  done
  need_docker
  container_exists && die "container '$CONTAINER' already exists. Use 'update' to upgrade or 'uninstall' first."

  mkdir -p "$HOME_DIR" "$DATA_DIR" "$BACKUP_DIR"
  if [[ ! -f "$CONF_FILE" || $force_conf -eq 1 ]]; then
    conf_template >"$CONF_FILE"
    log "Wrote $CONF_FILE"
  fi
  if [[ ! -f "$ENV_FILE" ]]; then
    env_template >"$ENV_FILE"
    chmod 600 "$ENV_FILE"
    if [[ -z "$toolbox_url" && -t 0 ]]; then
      read -r -p "Public URL of the toolbox [http://localhost:4000]: " toolbox_url
    fi
    if [[ -n "$toolbox_url" ]]; then
      env_set "$ENV_FILE" TOOLBOX_URL "$toolbox_url"
      env_set "$ENV_FILE" CORS_ORIGINS "$toolbox_url"
    fi
    log "Wrote $ENV_FILE"
  fi

  build_image "$(resolve_remote_commit || true)"
  create_container
  start_and_wait
  cat <<EOF

Installed. Next steps:
  - edit $ENV_FILE (SMTP, signing keys), then run: $0 recreate
  - create a first user:  STORE_USER_PASSWORD='...' $0 cli user:create you@example.com --contributor
  - schedule backups (cron):  0 4 * * * $SCRIPT_PATH backup
EOF
}

cmd_update() {
  local force=0 arg
  for arg in "$@"; do
    case "$arg" in
      --force) force=1 ;;
      *) die "unknown option for update: $arg" ;;
    esac
  done
  need_docker
  require_installed

  local remote current
  remote="$(resolve_remote_commit || true)"
  current="$(image_commit)"
  if [[ $force -eq 0 && -n "$remote" && "$remote" == "$current" ]]; then
    log "Already up to date (${current:0:12}). Use --force to rebuild anyway."
    return 0
  fi
  [[ -z "$remote" ]] && remote="$(date +%s)"

  # Build first: the running service is only touched once the new image is ready.
  local previous_image
  previous_image="$(docker image inspect -f '{{.Id}}' "$IMAGE" 2>/dev/null || true)"
  build_image "$remote"

  cmd_backup --quiet --no-restart
  stop_container
  remove_container
  create_container
  start_and_wait || die "the updated store is unhealthy. Restore the previous version with a backup if needed ($0 restore)."

  local new_image
  new_image="$(docker image inspect -f '{{.Id}}' "$IMAGE")"
  if [[ -n "$previous_image" && "$previous_image" != "$new_image" ]]; then
    docker rmi "$previous_image" >/dev/null 2>&1 || true
  fi
  docker image prune --force >/dev/null 2>&1 || true
  log "Updated to ${remote:0:12}"
}

cmd_start() {
  need_docker
  if ! container_exists; then
    image_exists || die "not installed. Run: $0 install"
    create_container
  fi
  if container_running; then
    log "$CONTAINER is already running"
    return 0
  fi
  fix_permissions
  start_and_wait
}

cmd_stop() {
  need_docker
  require_installed
  stop_container
}

cmd_restart() {
  need_docker
  require_installed
  stop_container
  start_and_wait
}

# Recreates the container from the current image, to apply store.env / port changes. Data is untouched.
cmd_recreate() {
  need_docker
  image_exists || die "image $IMAGE not found. Run: $0 install"
  stop_container
  remove_container
  create_container
  start_and_wait
}

cmd_config() {
  [[ -f "$ENV_FILE" ]] || die "$ENV_FILE is missing. Run: $0 install"
  "${EDITOR:-${VISUAL:-vi}}" "$ENV_FILE"
  if [[ -t 0 ]] && confirm "Recreate the container to apply the changes now?"; then
    cmd_recreate
  else
    log "Run '$0 recreate' to apply the changes."
  fi
}

cmd_status() {
  need_docker
  if ! container_exists; then
    echo "$CONTAINER: not installed"
    return 0
  fi
  local state health
  state="$(docker container inspect -f '{{.State.Status}}' "$CONTAINER")"
  health="$(docker container inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}n/a{{end}}' "$CONTAINER")"
  echo "container: $CONTAINER ($state, health: $health)"
  echo "image:     $IMAGE (commit: $(image_commit | cut -c1-12), ref: ${REPO_REF})"
  echo "listen:    ${STORE_BIND}:${STORE_PORT}"
  echo "home:      $HOME_DIR"
  [[ -d "$DATA_DIR" ]] && echo "data:      $(du -sh "$DATA_DIR" 2>/dev/null | cut -f1)"
  local last
  last="$(ls -1t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | head -n1 || true)"
  echo "backup:    ${last:-none}"
  local remote
  remote="$(resolve_remote_commit || true)"
  if [[ -n "$remote" && "$remote" != "$(image_commit)" ]]; then
    echo "update:    available (${remote:0:12}), run: $0 update"
  fi
}

cmd_logs() {
  need_docker
  require_installed
  docker logs "$@" "$CONTAINER"
}

# Cold backup of the database and avatars: the service is stopped so the SQLite WAL is consistent.
cmd_backup() {
  local quiet=0 restart=1 arg
  for arg in "$@"; do
    case "$arg" in
      --quiet) quiet=1 ;;
      --no-restart) restart=0 ;; # used by update, which recreates the container right after
      *) die "unknown option for backup: $arg" ;;
    esac
  done
  need_docker
  require_installed
  mkdir -p "$BACKUP_DIR"

  local was_running=0 name
  container_running && was_running=1
  name="backup_$(date +%Y_%m_%d_%H_%M_%S).tar.gz"

  stop_container
  # Always bring the service back, even if the archive step fails.
  local rc=0
  run_helper sh -c "tar czf '/backups/$name' -C / data && chown $(id -u):$(id -g) '/backups/$name' && chmod 640 '/backups/$name'" || rc=$?
  if [[ $was_running -eq 1 && $restart -eq 1 ]]; then start_and_wait || true; fi
  [[ $rc -eq 0 ]] || die "backup failed."

  [[ $quiet -eq 1 ]] || log "Backup written to $BACKUP_DIR/$name"
  if [[ "$BACKUP_KEEP" =~ ^[0-9]+$ && "$BACKUP_KEEP" -gt 0 ]]; then
    ls -1t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | tail -n +"$((BACKUP_KEEP + 1))" | xargs -r rm -f --
  fi
}

cmd_restore() {
  local file="" yes=0 arg
  for arg in "$@"; do
    case "$arg" in
      --yes) yes=1 ;;
      *) file="$arg" ;;
    esac
  done
  need_docker
  require_installed
  if [[ -z "$file" ]]; then
    echo "Available backups:"
    ls -1t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null || echo "  (none)"
    die "usage: $0 restore <backup.tar.gz> [--yes]"
  fi
  [[ -f "$file" ]] || file="$BACKUP_DIR/$file"
  [[ -f "$file" ]] || die "backup not found: $file"
  file="$(readlink -f "$file")"
  tar tzf "$file" | grep -q '^data/store.db$' || die "$file is not a store backup (data/store.db missing)."

  if [[ $yes -eq 0 ]]; then
    confirm "This replaces the current database and avatars with $(basename "$file")." || die "aborted."
  fi

  local was_running=0
  container_running && was_running=1
  stop_container
  log "Saving the current data before restoring"
  local safety="pre_restore_$(date +%Y_%m_%d_%H_%M_%S).tar.gz"
  run_helper sh -c "tar czf '/backups/$safety' -C / data && chown $(id -u):$(id -g) '/backups/$safety' && chmod 640 '/backups/$safety'"
  log "Restoring $(basename "$file")"
  docker run --rm --user root --entrypoint sh \
    -v "$DATA_DIR:/data" -v "$file:/restore/backup.tar.gz:ro" \
    "$IMAGE" -c "find /data -mindepth 1 -delete && tar xzf /restore/backup.tar.gz -C / && chown -R $NODE_UID:$NODE_UID /data"
  if [[ $was_running -eq 1 ]]; then start_and_wait; fi
}

# Runs an operations CLI command (user:create, system-key:generate, ...) of the store.
cmd_cli() {
  need_docker
  require_installed
  (($#)) || die "usage: $0 cli <command> [args]   (e.g. user:create, user:contributor, system-key:generate, db:reset)"
  container_running || die "the container is not running. Run: $0 start"
  local tty=()
  [[ -t 0 && -t 1 ]] && tty=(-t)
  # STORE_USER_PASSWORD is forwarded from the caller's environment when set.
  docker exec -i "${tty[@]}" ${STORE_USER_PASSWORD:+--env STORE_USER_PASSWORD} "$CONTAINER" node dist/cli.js "$@"
}

# One-shot import of a Directus SQLite copy into the (still empty) store database.
cmd_migrate() {
  local source="${1:-}"
  need_docker
  require_installed
  [[ -n "$source" ]] || die "usage: $0 migrate <directus.db>   (a COPY of the Directus database)"
  [[ -f "$source" ]] || die "file not found: $source"
  source="$(readlink -f "$source")"

  local was_running=0
  container_running && was_running=1
  stop_container
  fix_permissions
  log "Importing $source"
  local rc=0
  docker run --rm \
    --env-file "$ENV_FILE" --env LANG=C.UTF-8 --env LC_ALL=C.UTF-8 \
    -v "$DATA_DIR:/data" \
    -v "$source:/import/source.db:ro" \
    "$IMAGE" node dist/cli.js migrate:directus /import/source.db || rc=$?
  if [[ $was_running -eq 1 ]]; then start_and_wait || true; fi
  [[ $rc -eq 0 ]] || die "migration failed (the target database is left untouched)."
}

cmd_shell() {
  need_docker
  require_installed
  container_running || die "the container is not running."
  docker exec -it "$CONTAINER" sh
}

cmd_uninstall() {
  local purge=0 yes=0 arg
  for arg in "$@"; do
    case "$arg" in
      --purge) purge=1 ;;
      --yes) yes=1 ;;
      *) die "unknown option for uninstall: $arg" ;;
    esac
  done
  need_docker
  if [[ $yes -eq 0 ]]; then
    if [[ $purge -eq 1 ]]; then
      confirm "Remove the container, image AND all data in $DATA_DIR and $BACKUP_DIR?" || die "aborted."
    else
      confirm "Remove the container and image? Data and backups are kept." || die "aborted."
    fi
  fi
  remove_container
  docker rmi "$IMAGE" >/dev/null 2>&1 || true
  if [[ $purge -eq 1 ]]; then
    # Data is owned by the container user, so delete it through the container.
    if image_exists; then run_helper sh -c 'find /data /backups -mindepth 1 -delete'; else rm -rf "$DATA_DIR" "$BACKUP_DIR" 2>/dev/null || warn "could not delete $DATA_DIR, remove it with sudo."; fi
    rm -f "$ENV_FILE" "$CONF_FILE"
    rmdir "$DATA_DIR" "$BACKUP_DIR" 2>/dev/null || true
  fi
  log "Uninstalled"
}

cmd_self_update() {
  local tmp
  tmp="$(mktemp)"
  curl -fsSL "$SCRIPT_URL" -o "$tmp" || { rm -f "$tmp"; die "could not download $SCRIPT_URL"; }
  bash -n "$tmp" || { rm -f "$tmp"; die "the downloaded script is invalid, keeping the current one."; }
  if cmp -s "$tmp" "$SCRIPT_PATH"; then
    rm -f "$tmp"
    log "ddf-store.sh is already up to date"
    return 0
  fi
  chmod --reference="$SCRIPT_PATH" "$tmp"
  mv "$tmp" "$SCRIPT_PATH"
  log "ddf-store.sh updated. The embedded Dockerfile applies on the next '$0 update --force'."
}

usage() {
  cat <<EOF
Usage: $0 <command> [options]

Setup
  install [--toolbox-url URL] [--port N] [--bind ADDR] [--ref REF] [--repo URL]
                          build the image from git, create and start the container
  update [--force]        rebuild from the latest commit (backup first), then recreate; no-op if up to date
  recreate                recreate the container from the current image (apply store.env / port changes)
  config                  edit store.env, then recreate
  uninstall [--purge]     remove container and image; --purge also deletes data, backups and settings
  self-update             download the latest version of this script

Service
  start | stop | restart  control the container
  status                  state, health, version, last backup, update availability
  logs [-f] [--tail N]    container logs (docker logs options)

Data
  backup                  cold backup of database + avatars to backups/ (brief downtime)
  restore [file] [--yes]  restore a backup (the current data is saved first); no file lists backups
  migrate <directus.db>   one-shot import of a Directus database copy
  cli <command> [args]    store operations CLI: user:create, user:contributor, system-key:generate, db:reset
  shell                   open a shell in the container

Files live in: $HOME_DIR (override with DDF_STORE_HOME)
EOF
}

main() {
  local command="${1:-help}"
  (($#)) && shift
  load_conf
  case "$command" in
    install) cmd_install "$@" ;;
    update) cmd_update "$@" ;;
    start) cmd_start ;;
    stop) cmd_stop ;;
    restart) cmd_restart ;;
    recreate) cmd_recreate ;;
    config) cmd_config ;;
    status) cmd_status ;;
    logs) cmd_logs "$@" ;;
    backup) cmd_backup "$@" ;;
    restore) cmd_restore "$@" ;;
    migrate) cmd_migrate "$@" ;;
    cli) cmd_cli "$@" ;;
    shell) cmd_shell ;;
    uninstall) cmd_uninstall "$@" ;;
    self-update) cmd_self_update ;;
    help | -h | --help) usage ;;
    *)
      usage >&2
      exit 1
      ;;
  esac
}

main "$@"
