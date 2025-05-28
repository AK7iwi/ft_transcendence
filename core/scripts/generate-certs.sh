#!/bin/bash

# Define paths relative to the project root
CERT_DIR="../core/certs"
CERT_FILE="$CERT_DIR/cert.pem"
KEY_FILE="$CERT_DIR/key.pem"

# Create only the certs directory if it doesn't exist
if [ ! -d "$CERT_DIR" ]; then
    echo "Creating certs directory..."
    mkdir "$CERT_DIR"  # Removed -p flag to only create certs directory
fi

# Check if certificates exist
if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
    echo "Generating new SSL certificates..."
    
    # Generate private key
    openssl genrsa -out "$KEY_FILE" 2048
    
    # Generate certificate signing request
    openssl req -new -key "$KEY_FILE" -out "$CERT_DIR/csr.pem" \
        -subj "/CN=localhost" \
        -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
    
    # Generate self-signed certificate
    openssl x509 -req -in "$CERT_DIR/csr.pem" \
        -signkey "$KEY_FILE" \
        -out "$CERT_FILE" \
        -days 365 \
        -extfile <(echo "subjectAltName=DNS:localhost,IP:127.0.0.1")
    
    # Clean up CSR
    rm "$CERT_DIR/csr.pem"
    
    # Set proper permissions
    chmod 600 "$KEY_FILE"
    chmod 644 "$CERT_FILE"
    
    echo "Certificates generated successfully!"
    echo "Certificate location: $CERT_FILE"
    echo "Key location: $KEY_FILE"
else
    echo "Using existing certificates..."
fi

# Verify certificates exist
if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
    echo "Certificate verification successful"
    ls -la "$CERT_DIR"
else
    echo "ERROR: Certificate generation failed!"
    exit 1
fi