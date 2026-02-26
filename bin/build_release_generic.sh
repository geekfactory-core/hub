#!/bin/bash
set -euo pipefail

. ./bin/utils.sh

export LOCKED=--locked

header "Generating hub backend wasm"
./bin/generate_wasm.sh
./bin/compress_wasm.sh

header "Preparing frontend release for embedding into hub assets canister"
npm ci --omit=optional
npm i --save-dev @rollup/rollup-linux-x64-gnu

FRONTEND_VITE_MODE="${FRONTEND_BUILD_MODE}"
FRONTEND_TSCONFIG="tsconfig.${FRONTEND_BUILD_MODE}.json"

echo "Using FRONTEND_BUILD_MODE=$FRONTEND_BUILD_MODE => FRONTEND_TSCONFIG=$FRONTEND_TSCONFIG, FRONTEND_VITE_MODE=$FRONTEND_VITE_MODE"

export PATH="$PWD/node_modules/.bin:$PATH"
pushd frontend
tsc -p "$FRONTEND_TSCONFIG" && NODE_ENV=production vite build --mode "$FRONTEND_VITE_MODE"
popd

header "Generating hub assets wasm"
cargo build --target wasm32-unknown-unknown --release -p hub_assets_backend --locked
