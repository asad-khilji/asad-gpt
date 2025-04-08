#!/bin/bash

# Locate the Documents and target folder
DOCUMENTS_PATH=~/Documents
TARGET_FOLDER="$DOCUMENTS_PATH/asad-gpt"

# Change directory
cd "$TARGET_FOLDER" || {
  echo "❌ Folder not found!"
  exit 1
}

# Start the server in background
python3 -m http.server 8000 &

# Wait a moment for server to boot
sleep 1

# Open the site in browser at localhost
open http://localhost:8000


