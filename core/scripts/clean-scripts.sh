#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CORE_DIR="$(dirname "$SCRIPT_DIR")"
SRCS_DIR="$CORE_DIR/src"

# Remove certificates from front and back directories
rm -rf "$SRCS_DIR/front/certs"
rm -rf "$SRCS_DIR/back/src/gateway/certs"

# Remove security files
rm -rf "$SRCS_DIR/back/src/gateway/security"
rm -rf "$SRCS_DIR/back/src/service/auth/security"
rm -rf "$SRCS_DIR/back/src/service/user/security"
rm -rf "$SRCS_DIR/back/src/service/friend/security"

# Remove utils files
rm -rf "$SRCS_DIR/back/src/service/auth/src/utils"
rm -rf "$SRCS_DIR/back/src/service/user/src/utils"
rm -rf "$SRCS_DIR/back/src/service/friend/src/utils"


echo "Cleaned up all certificates and security files"