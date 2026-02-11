#!/bin/bash
set -euo pipefail

. ./bin/utils.sh

header "Generate candid"

cargo run --manifest-path backend/candid/Cargo.toml > backend/api/can.did
