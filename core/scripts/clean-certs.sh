#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CORE_DIR="$(dirname "$SCRIPT_DIR")"
SRCS_DIR="$CORE_DIR/src"

# Remove certificates from front and back directories
rm -rf "$SRCS_DIR/front/certs"
rm -rf "$SRCS_DIR/back/gateway/certs"

# Remove security files from all services
rm -rf "$SRCS_DIR/back/gateway/security"
rm -rf "$SRCS_DIR/back/service/auth/security"
rm -rf "$SRCS_DIR/back/service/user/security"

echo "Cleaned up all certificates and security files"