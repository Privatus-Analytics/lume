#!/bin/sh
# Runs format, lint, type check, tests, the real Lume build and the publish
# dry run in a pinned Deno image. Usage: ./run-docker.sh
set -e
DENO_IMAGE=denoland/deno:alpine-2.9.8

docker run --rm -v "$PWD":/app -w /app -e DENO_DIR=/tmp/deno "$DENO_IMAGE" sh -c 'set -e
  deno fmt --check
  deno lint
  deno check src/mod.ts
  deno test --allow-env tests/
  deno test --allow-all integration/
  deno publish --dry-run --allow-dirty --config jsr.json
'
