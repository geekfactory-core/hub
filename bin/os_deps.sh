#!/bin/bash

# NOTE: On macOS a specific version of llvm-ar and clang need to be set here.
# Otherwise the wasm compilation of rust-secp256k1 will fail.
# https://github.com/dfinity/bitcoin-developer-preview/blob/master/examples/rust/build.sh

if [[ "$OSTYPE" == darwin* ]]; then
  export AR="/usr/local/opt/llvm/bin/llvm-ar" 
  export CC="/usr/local/opt/llvm/bin/clang"
fi

