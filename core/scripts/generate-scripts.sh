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

# Set proper permissions for security files
find "$SRCS_DIR/back/gateway/security" -type f -exec chmod 644 {} \;
find "$SRCS_DIR/back/service/auth/security" -type f -exec chmod 644 {} \;
find "$SRCS_DIR/back/service/user/security" -type f -exec chmod 644 {} \;

# Remove the temporary certs directory
rm -rf "$TEMP_CERTS_DIR"

echo "SSL certificates and security files have been generated and copied to all services" 