# Verifying Releases

## Overview

Releases are built using a [reproducible build](https://docs.internetcomputer.org/building-apps/best-practices/reproducible-builds) script. The same script can be used to independently verify that the deployed canister contains the exact code published in the repository.

## Prerequisites

- Docker 28.2.2
- docker-buildx (on some systems it must be installed explicitly)
- [Lima](https://docs.internetcomputer.org/building-apps/best-practices/reproducible-builds#build-environments-using-docker) (if you are using macOS)

## Steps to verify

1. Check out the source code by release tag:

```bash
git checkout 0.0.2
```

2. Run the build script:

```bash
bin/repro-build-in-docker.sh
```

3. Check the last messages:

```bash
Built wasm hash and size:
target/release/reproducible/hub_assets_backend.wasm cd6dda27c84ba36ec217e2e870491aed6182102577dcdd087722343093553452 - 4386224
target/release/reproducible/hub_canister_impl-opt.wasm 584efd0339d4bc467bbf7f992a429001bc4425d997106e20d11f3e4098d4e711 - 2859064
```

4. Fetch the hashes of both canisters and compare them with the hashes from the previous step:

```bash
dfx canister --ic info hub
dfx canister --ic info hub_assets
```
