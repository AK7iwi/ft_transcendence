#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CORE_DIR="$(dirname "$SCRIPT_DIR")"
SRCS_DIR="$CORE_DIR/src"

# Remove certificates from front and back directories
rm -rf "$SRCS_DIR/front/certs"
rm -rf "$SRCS_DIR/back/gateway/certs"

# Remove security files
rm -rf "$SRCS_DIR/back/gateway/security"
rm -rf "$SRCS_DIR/back/service/auth/security"
rm -rf "$SRCS_DIR/back/service/user/security"
rm -rf "$SRCS_DIR/back/service/friend/security"

# Remove utils files
rm -rf "$SRCS_DIR/back/service/auth/src/utils"
rm -rf "$SRCS_DIR/back/service/user/src/utils"
rm -rf "$SRCS_DIR/back/service/friend/src/utils"

# Remove internal files
rm -rf "$SRCS_DIR/back/service/user/src/internal"
rm -rf "$SRCS_DIR/back/service/auth/src/internal"
rm -rf "$SRCS_DIR/back/service/friend/src/internal"

rm -rf "$SRCS_DIR/back/service/user/src/database/db_models/db.getter.js"
rm -rf "$SRCS_DIR/back/service/user/src/database/db_models/db.update.js"

rm -rf "$SRCS_DIR/back/service/auth/src/database/db_models/db.getter.js"
rm -rf "$SRCS_DIR/back/service/auth/src/database/db_models/db.update.js"

rm -rf "$SRCS_DIR/back/service/friend/src/database/db_models/db.getter.js"
rm -rf "$SRCS_DIR/back/service/friend/src/database/db_models/db.update.js"


echo "Cleaned up all certificates and security files"