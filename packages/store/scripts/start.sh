#!/bin/bash

# Get the path of the script directory
SCRIPT_PATH="$(dirname -- "${BASH_SOURCE[0]}")"

# Check if pocketbase binary exists
if [ ! -f "$SCRIPT_PATH/../pocketbase" ]; then
    echo "pocketbase binary not found. Installing..."
    bash $SCRIPT_PATH/install.sh
fi

# Start the PocketBase application
$SCRIPT_PATH/../pocketbase serve
