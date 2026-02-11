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
git checkout 0.0.1
```

2. Run the build script:

```bash
bin/repro-build-in-docker.sh
```

3. Check the last messages:

```bash
Built wasm hash and size:
target/release/reproducible/hub_assets_backend.wasm 593f586d5a454510eb4576c2955fad72cd3d216df130817ec0581af3ea165c59 - 4384432
target/release/reproducible/hub_canister_impl-opt.wasm 25898e759420fefe312f89541cd314837f7b90bcd55397fd2bb51220cf4a3757 - 2838790
```

4. Fetch the hashes of both canisters and compare them with the hashes from the previous step:

```bash
dfx canister --ic info hub
dfx canister --ic info hub_assets
```
