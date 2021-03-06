#!/bin/bash

source ./define-functions.sh

export PRJROOT=/home/clay/ferguson/Quantizr
export SCRIPTS=${PRJROOT}/scripts

export SECRETS=/home/clay/ferguson/secrets
source ${SECRETS}/secrets.sh

export ipfs_data=/home/clay/.ipfs
export ipfs_staging=/home/clay/.ipfs/staging

export quanta_domain=localhost

# IMPORTANT: ***** You must set this to 'true' to regenerate the Java->TypeScript interfaces.
export CLEAN=true

# Docker files are relative to project root
export docker_compose_yaml=docker-compose-dev.yaml

# Not used: mongo is setup inside the docker-compose-dev.yaml for now
# export docker_compose_mongo_yaml=docker-compose-dev-mongo.yaml

export mvn_profile=dev

export MONGO_BASE=/home/clay/ferguson
export QUANTA_BASE=/home/clay/quanta-localhost-dev
