FROM ubuntu:22.04

ENV RELEASE_MODULE=hub

ENV TZ=UTC

# Install the basic environment needed for our build tools.
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN apt -yq update
RUN apt -yq install --no-install-recommends curl ca-certificates build-essential pkg-config libssl-dev llvm-dev liblmdb-dev libunwind-dev clang cmake

# Install Node.js using nvm
ENV NVM_DIR=/root/.nvm
ENV NVM_VERSION=v0.39.1
ENV NODE_VERSION=24.11.1
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin:${PATH}"
RUN curl --fail -sSf https://raw.githubusercontent.com/creationix/nvm/${NVM_VERSION}/install.sh | bash
RUN . "${NVM_DIR}/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "${NVM_DIR}/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "${NVM_DIR}/nvm.sh" && nvm alias default v${NODE_VERSION}

# Install Rust and Cargo
ENV RUSTUP_HOME=/opt/rustup
ENV CARGO_HOME=/opt/cargo
ENV RUST_VERSION=1.90.0
ENV PATH=/opt/cargo/bin:${PATH}
RUN curl --fail https://sh.rustup.rs -sSf \
    | sh -s -- -y --default-toolchain ${RUST_VERSION}-x86_64-unknown-linux-gnu --no-modify-path
RUN rustup default ${RUST_VERSION}-x86_64-unknown-linux-gnu
RUN rustup target add wasm32-unknown-unknown
RUN cargo install ic-wasm

# Install dfx
ENV DFX_VERSION=0.29.1
ENV DFXVM_INIT_YES=true
RUN curl -fsSL https://internetcomputer.org/install.sh | bash 

ENV PATH=/root/.local/share/dfx/bin:${PATH}

COPY --from=module / /canister/${RELEASE_MODULE}
WORKDIR /canister/${RELEASE_MODULE}

ENV RELEASE_DIR_PREFIX=target/wasm32-unknown-unknown/release
ENV RELEASE_FILE_PREFIX=$RELEASE_DIR_PREFIX/${RELEASE_MODULE}_canister_impl
ARG FRONTEND_BUILD_MODE=production
RUN bin/build_release_generic.sh
