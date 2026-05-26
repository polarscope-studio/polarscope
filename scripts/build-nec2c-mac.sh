#!/bin/bash
# build-nec2c-mac.sh
# Compiles nec2c (NEC-2 solver) from source for macOS
# and places the binary in NEC/nec2c

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
NEC_DIR="$PROJECT_DIR/NEC"
BUILD_DIR="$PROJECT_DIR/.nec2c-build"

echo "==> Building nec2c for macOS..."
echo "    Output: $NEC_DIR/nec2c"

# Check dependencies
if ! command -v gcc &>/dev/null && ! command -v cc &>/dev/null; then
    echo "ERROR: No C compiler found. Install Xcode Command Line Tools:"
    echo "  xcode-select --install"
    exit 1
fi

# Clone or update
if [ -d "$BUILD_DIR" ]; then
    echo "==> Updating existing nec2c source..."
    cd "$BUILD_DIR"
    git pull 2>/dev/null || true
else
    echo "==> Cloning nec2c source..."
    git clone https://github.com/KJ7LNW/nec2c.git "$BUILD_DIR"
    cd "$BUILD_DIR"
fi

# Build
echo "==> Configuring..."
if [ -f autogen.sh ]; then
    ./autogen.sh 2>&1
fi
./configure --prefix="$BUILD_DIR/install" 2>&1
echo "==> Compiling..."
make -j$(sysctl -n hw.ncpu) 2>&1

# Copy binary
mkdir -p "$NEC_DIR"
if [ -f src/nec2c ]; then
    cp src/nec2c "$NEC_DIR/nec2c"
elif [ -f nec2c ]; then
    cp nec2c "$NEC_DIR/nec2c"
else
    echo "ERROR: nec2c binary not found after build"
    exit 1
fi

chmod +x "$NEC_DIR/nec2c"
echo ""
echo "==> SUCCESS: nec2c compiled and placed at $NEC_DIR/nec2c"
echo "    You can now run: npm start"
