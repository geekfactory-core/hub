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
npm run build

header "Generating hub assets wasm"
cargo build --target wasm32-unknown-unknown --release -p hub_assets_backend --locked
