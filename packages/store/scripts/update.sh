#!/bin/bash

# Get the path of the script directory
SCRIPT_PATH="$(dirname -- "${BASH_SOURCE[0]}")"

# Update the PocketBase application
$SCRIPT_PATH/../pocketbase update

# Get the version of the PocketBase application and append it to the pb_version.md file
$SCRIPT_PATH/../pocketbase --version > $SCRIPT_PATH/../pb_version.md
