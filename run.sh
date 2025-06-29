#!/bin/bash

# PaySavvy Production Deployment Script
echo "Starting PaySavvy Production Server..."
echo "Node.js version: $(node --version)"
echo "Environment: ${NODE_ENV:-production}"
echo "Port: ${PORT:-5000}"

# Ensure proper file permissions
chmod +x start.js
chmod +x server.js

# Start the server
exec node server.js