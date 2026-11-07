#!/usr/bin/env bash
# Manual smoke test: builds the store image, starts it, checks /health and runs an operations CLI command.
# Usage: apps/store/scripts/docker-smoke.sh   (requires Docker; not run in CI)
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
image="ddf-store-smoke:local"
container="ddf-store-smoke-$$"
port="${SMOKE_PORT:-3999}"

cleanup() { docker rm --force "$container" >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker build --file "$root/apps/store/Dockerfile" --tag "$image" "$root"
docker run --detach --name "$container" --publish "127.0.0.1:$port:3000" "$image" >/dev/null

for _ in $(seq 1 30); do
  if curl --fail --silent "http://127.0.0.1:$port/health" >/dev/null; then
    healthy=1
    break
  fi
  sleep 1
done
if [ -z "${healthy:-}" ]; then
  echo "Store did not become healthy" >&2
  docker logs "$container" >&2
  exit 1
fi
echo "/health OK"

output="$(docker exec "$container" node dist/cli.js system-key:generate stable)"
grep -q '^STABLE_PRIVATE_KEY=[0-9a-f]\{64\}$' <<<"$output"
echo "Operations CLI OK"
