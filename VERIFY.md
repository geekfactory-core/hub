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
target/release/reproducible/hub_assets_backend.wasm 21de9475288258b38108489c1ae6ea0c14e6be10ab01272c94b12e2b42902103 - 4390442
target/release/reproducible/hub_canister_impl-opt.wasm 4f5b05f1b0ffb1bef09add8cd8b5e78ab0fc92cc41f35ca2d18001debb9d40dc - 2917746
```

4. Fetch the hashes of both canisters and compare them with the hashes from the previous step:

```bash
dfx canister --ic info hub
dfx canister --ic info hub_assets
```
