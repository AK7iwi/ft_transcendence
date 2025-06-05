#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CORE_DIR="$(dirname "$SCRIPT_DIR")"
SRCS_DIR="$CORE_DIR/src"

# Create temporary certs directory
TEMP_CERTS_DIR="$SCRIPT_DIR/temp_certs"
mkdir -p "$TEMP_CERTS_DIR"

# Generate private key and certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$TEMP_CERTS_DIR/key.pem" \
    -out "$TEMP_CERTS_DIR/cert.pem" \
    -subj "/C=FR/ST=IDF/L=Paris/O=42/OU=42/CN=localhost"

# Set proper permissions for certificates
chmod 600 "$TEMP_CERTS_DIR/key.pem"
chmod 644 "$TEMP_CERTS_DIR/cert.pem"

# Create necessary directories
mkdir -p "$SRCS_DIR/front/certs"
mkdir -p "$SRCS_DIR/back/gateway/certs"

mkdir -p "$SRCS_DIR/back/gateway/security"
mkdir -p "$SRCS_DIR/back/service/auth/security"
mkdir -p "$SRCS_DIR/back/service/user/security"
mkdir -p "$SRCS_DIR/back/service/friend/security"

mkdir -p "$SRCS_DIR/back/service/auth/src/utils"
mkdir -p "$SRCS_DIR/back/service/user/src/utils"
mkdir -p "$SRCS_DIR/back/service/friend/src/utils"

mkdir -p "$SRCS_DIR/back/service/user/src/internal"
mkdir -p "$SRCS_DIR/back/service/auth/src/internal"
mkdir -p "$SRCS_DIR/back/service/friend/src/internal"

mkdir -p "$SRCS_DIR/back/service/user/src/database/db_models"
mkdir -p "$SRCS_DIR/back/service/auth/src/database/db_models"
mkdir -p "$SRCS_DIR/back/service/friend/src/database/db_models"

# Copy certificates to front and back directories
cp "$TEMP_CERTS_DIR/key.pem" "$SRCS_DIR/front/certs/"
cp "$TEMP_CERTS_DIR/cert.pem" "$SRCS_DIR/front/certs/"
cp "$TEMP_CERTS_DIR/key.pem" "$SRCS_DIR/back/gateway/certs/"
cp "$TEMP_CERTS_DIR/cert.pem" "$SRCS_DIR/back/gateway/certs/"

# Set proper permissions for certificates in destination directories
chmod 600 "$SRCS_DIR/back/gateway/certs/key.pem"
chmod 644 "$SRCS_DIR/back/gateway/certs/cert.pem"
chmod 600 "$SRCS_DIR/front/certs/key.pem"
chmod 644 "$SRCS_DIR/front/certs/cert.pem"

# Copy security files to all services
cp -r "$SRCS_DIR/back/security/"* "$SRCS_DIR/back/gateway/security/"
cp -r "$SRCS_DIR/back/security/"* "$SRCS_DIR/back/service/auth/security/"
cp -r "$SRCS_DIR/back/security/"* "$SRCS_DIR/back/service/user/security/"
cp -r "$SRCS_DIR/back/security/"* "$SRCS_DIR/back/service/friend/security/"

# Set proper permissions for security files
find "$SRCS_DIR/back/gateway/security" -type f -exec chmod 644 {} \;
find "$SRCS_DIR/back/service/auth/security" -type f -exec chmod 644 {} \;
find "$SRCS_DIR/back/service/user/security" -type f -exec chmod 644 {} \;
find "$SRCS_DIR/back/service/friend/security" -type f -exec chmod 644 {} \;

# Copy utils files to all services
cp -r "$SRCS_DIR/back/utils/"* "$SRCS_DIR/back/service/user/src/utils/"
cp -r "$SRCS_DIR/back/utils/"* "$SRCS_DIR/back/service/auth/src/utils/"
cp -r "$SRCS_DIR/back/utils/"* "$SRCS_DIR/back/service/friend/src/utils/"

# Set proper permissions for utils files
find "$SRCS_DIR/back/service/user/src/utils" -type f -exec chmod 644 {} \;
find "$SRCS_DIR/back/service/auth/src/utils" -type f -exec chmod 644 {} \;
find "$SRCS_DIR/back/service/friend/src/utils" -type f -exec chmod 644 {} \;

# Copy internal files to all services
cp -r "$SRCS_DIR/back/internal/"* "$SRCS_DIR/back/service/user/src/internal/"
cp -r "$SRCS_DIR/back/internal/"* "$SRCS_DIR/back/service/auth/src/internal/"
cp -r "$SRCS_DIR/back/internal/"* "$SRCS_DIR/back/service/friend/src/internal/"

# Set proper permissions for internal files
find "$SRCS_DIR/back/service/user/src/internal" -type f -exec chmod 644 {} \;
find "$SRCS_DIR/back/service/auth/src/internal" -type f -exec chmod 644 {} \;
find "$SRCS_DIR/back/service/friend/src/internal" -type f -exec chmod 644 {} \;

# Copy database files to all services
cp -r "$SRCS_DIR/back/db_models/"* "$SRCS_DIR/back/service/user/src/database/db_models/"
cp -r "$SRCS_DIR/back/db_models/"* "$SRCS_DIR/back/service/auth/src/database/db_models/"
cp -r "$SRCS_DIR/back/db_models/"* "$SRCS_DIR/back/service/friend/src/database/db_models/"

# Set proper permissions for database files
find "$SRCS_DIR/back/service/user/src/database/db_models" -type f -exec chmod 644 {} \;
find "$SRCS_DIR/back/service/auth/src/database/db_models" -type f -exec chmod 644 {} \;
find "$SRCS_DIR/back/service/friend/src/database/db_models" -type f -exec chmod 644 {} \;

# Remove the temporary certs directory
rm -rf "$TEMP_CERTS_DIR"

echo "SSL certificates and security files have been generated and copied to all services" 