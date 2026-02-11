#!/bin/bash
set -euo pipefail

. ./bin/utils.sh

PACKAGE="hub_canister_impl"

header "Compressing wasm"

xz -fkz target/wasm32-unknown-unknown/release/$PACKAGE-opt.wasm
