#!/bin/bash

# Script to start the Virtual Bookshelf application

echo "Starting Virtual Bookshelf application..."

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Path to the index.html file
INDEX_FILE="$SCRIPT_DIR/index.html"

# Check if the index.html file exists
if [ ! -f "$INDEX_FILE" ]; then
  echo "Error: index.html not found in $SCRIPT_DIR"
  exit 1
fi

# Open the index.html file in the default browser
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  open "$INDEX_FILE"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  if command -v xdg-open > /dev/null; then
    xdg-open "$INDEX_FILE"
  else
    echo "Error: Could not find a way to open the browser on your system."
    echo "Please open $INDEX_FILE manually in your browser."
    exit 1
  fi
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
  # Windows with Git Bash or similar
  start "" "$INDEX_FILE"
else
  echo "Unsupported OS: $OSTYPE"
  echo "Please open $INDEX_FILE manually in your browser."
  exit 1
fi

echo "Virtual Bookshelf should now be open in your browser."
echo "If it didn't open automatically, please open $INDEX_FILE manually."

# Print helpful information
echo ""
echo "=== HELPFUL TIPS ==="
echo "1. Use the 'Import Spine Images' button to import extracted book spines"
echo "2. Drag and drop books to rearrange them"
echo "3. Double-click on a book to see its details"
echo "4. See GETTING_STARTED.md for more detailed instructions"
echo ""
