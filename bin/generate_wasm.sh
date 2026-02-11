#!/bin/bash
set -euo pipefail

. ./bin/utils.sh

header "Building wasm"

PACKAGE="hub_canister_impl"

. ./bin/os_deps.sh
cargo build --target wasm32-unknown-unknown --release --package "$PACKAGE" ${LOCKED:-}

RELEASE_DIR=target/wasm32-unknown-unknown/release
RELEASE_FILE_PREFIX="$RELEASE_DIR/$PACKAGE"

header "Optimising wasm"

# please install ic-wasm using `cargo install ic-wasm`
ic-wasm "$RELEASE_FILE_PREFIX".wasm -o "${RELEASE_FILE_PREFIX}"-shrink.wasm shrink
ic-wasm "$RELEASE_FILE_PREFIX"-shrink.wasm -o "${RELEASE_FILE_PREFIX}"-opt.wasm optimize O1
