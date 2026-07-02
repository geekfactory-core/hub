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
git checkout 0.0.4
```

2. Run the build script:

```bash
bin/repro-build-in-docker.sh
```

3. Check the last messages:

```bash
Built wasm hash and size:
target/release/reproducible/hub_assets_backend.wasm 7d2f42d772709d38f4810d3c16b5a9eb08c9c703e904ac458772cfecc0913683 - 4391210
target/release/reproducible/hub_canister_impl-opt.wasm 7a331cf66c1a47312d567e7435629245834305adc46c90e9edb33f723296233f - 2917747
```

4. Fetch the hashes of both canisters and compare them with the hashes from the previous step:

```bash
dfx canister --ic info hub
dfx canister --ic info hub_assets
```
