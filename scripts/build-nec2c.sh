#!/usr/bin/env bash
# build-nec2c.sh — compile nec2c from source and place it at NEC/nec2c
# Works on macOS (Intel + Apple Silicon) and Linux (x86_64 + arm64)
#
# Prerequisites:
#   macOS : xcode-select --install
#   Linux : sudo apt install build-essential autoconf automake libtool
#             (or equivalent for your distro)
#
# Usage:
#   bash scripts/build-nec2c.sh

set -e

REPO="https://github.com/KJ6KUK/nec2c.git"
BUILD_DIR=".nec2c-build"
OUT_DIR="$(dirname "$0")/../NEC"

echo "[build-nec2c] Cloning nec2c..."
rm -rf "$BUILD_DIR"
git clone --depth 1 "$REPO" "$BUILD_DIR"

cd "$BUILD_DIR"
echo "[build-nec2c] Configuring..."
if [ -f autogen.sh ]; then
    bash autogen.sh
fi
./configure
echo "[build-nec2c] Compiling..."
make -j"$(nproc 2>/dev/null || sysctl -n hw.logicalcpu 2>/dev/null || echo 2)"

BINARY="$(find . -maxdepth 2 -type f -name 'nec2c' | head -1)"
if [ -z "$BINARY" ]; then
    echo "[build-nec2c] ERROR: binary not found after build" >&2
    exit 1
fi

cd ..
mkdir -p "$OUT_DIR"
cp "$BUILD_DIR/$BINARY" "$OUT_DIR/nec2c"
chmod +x "$OUT_DIR/nec2c"
rm -rf "$BUILD_DIR"

echo "[build-nec2c] Done — NEC/nec2c is ready ($(file "$OUT_DIR/nec2c" | cut -d: -f2 | xargs))"
