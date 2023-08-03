#!/bin/bash

# Get the path of the script directory
SCRIPT_PATH="$(dirname -- "${BASH_SOURCE[0]}")"

# Get the version number from the pb_version.md file
VERSION=$(cat $SCRIPT_PATH/../pb_version.md | cut -d " " -f3)

# Print the version number being installed
echo "Installing pocketbase version $VERSION"

# Download the pocketbase binary for the specified version
wget -O /tmp/pocketbase_${VERSION}_linux_amd64.zip https://github.com/pocketbase/pocketbase/releases/download/v${VERSION}/pocketbase_${VERSION}_linux_amd64.zip

# Remove any existing pocketbase binary
rm $SCRIPT_PATH/../pocketbase

# Extract the pocketbase binary from the downloaded zip file
unzip /tmp/pocketbase_${VERSION}_linux_amd64.zip pocketbase -d $SCRIPT_PATH/../

# Remove the downloaded zip file
rm /tmp/pocketbase_${VERSION}_linux_amd64.zip