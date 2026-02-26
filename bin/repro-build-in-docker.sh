#!/bin/bash
set -euo pipefail

. ./bin/utils.sh

export DOCKER_DEFAULT_PLATFORM=linux/amd64

MODULE=hub

LIMACTL_IS_STARTED_BY_SCRIPT=0
# Check if the operating system is macOS
if [[ "$OSTYPE" == darwin* ]]; then
  # we use lima under MacOS for docker
  command -v limactl >/dev/null 2>&1 || {
    echo "Lima is not available"
    echo "Please install it: https://github.com/lima-vm/lima"
    exit 1
  }

  INSTANCE_NAME="docker"
  STATUS=$(limactl list | awk -v instance="$INSTANCE_NAME" '$1 == instance {print $2}')

  # Check the status of the instance and take appropriate actions
  if [ "$STATUS" = "Stopped" ]; then
    echo "Lima instance '$INSTANCE_NAME' found and it is stopped."
    echo "Starting the Lima instance '$INSTANCE_NAME'"

    limactl start $INSTANCE_NAME

    if [ $? -eq 0 ]; then
      echo "The Lima instance '$INSTANCE_NAME' has started successfully."
      LIMACTL_IS_STARTED_BY_SCRIPT=1
    fi
  elif [ "$STATUS" = "Running" ]; then
    echo "The Lima instance '$INSTANCE_NAME' is running."
  else
    arch=$(uname -m)
    echo "Lima instance '$INSTANCE_NAME' not found."
    echo "Creating a new instance named '$INSTANCE_NAME' for arch=$arch"

    if [ "$arch" = "arm64" ]; then
      limactl start template://$INSTANCE_NAME --vm-type=vz --rosetta
    else
      limactl start template://$INSTANCE_NAME
    fi
    LIMACTL_IS_STARTED_BY_SCRIPT=1
  fi
  export DOCKER_HOST=$(limactl list docker --format 'unix://{{.Dir}}/sock/docker.sock')
fi

HOST_TARGET_DIR=target/release/reproducible
mkdir -p $HOST_TARGET_DIR
header "Building $MODULE with Docker"
docker build ${ADDITIONAL_DOCKER_ARGS:-} --progress=plain --build-context module=$(pwd) -t reprocanister .
docker create --name tmp-reprocontainer reprocanister
docker cp tmp-reprocontainer:/canister/${MODULE}/target/wasm32-unknown-unknown/release/${MODULE}_canister_impl-opt.wasm $HOST_TARGET_DIR
docker cp tmp-reprocontainer:/canister/${MODULE}/target/wasm32-unknown-unknown/release/${MODULE}_assets_backend.wasm $HOST_TARGET_DIR
rm -rf $HOST_TARGET_DIR/frontend
docker cp tmp-reprocontainer:/canister/${MODULE}/release/frontend $HOST_TARGET_DIR
docker rm tmp-reprocontainer

if ls target/release/reproducible/*.wasm 1>/dev/null 2>&1; then
  echo "Built wasm hash and size:"
  for file in target/release/reproducible/*.wasm; do
      fhash=$(sha256sum < $file)
      fsize=$(wc -c < $file)
      echo $file $fhash $fsize
  done
fi

if [ $LIMACTL_IS_STARTED_BY_SCRIPT -eq 1 ]; then
  echo "Shutting down Lima docker instance"
  limactl stop docker
fi
