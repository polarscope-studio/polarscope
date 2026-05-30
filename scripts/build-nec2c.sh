#!/usr/bin/env bash
# build-nec2c.sh — compile nec2c from source and place it at NEC/nec2c
# Works on macOS (Intel + Apple Silicon) and Linux (x86_64 + arm64)
#
# Prerequisites:
#   macOS : xcode-select --install
#   Linux : sudo apt install build-essential autoconf automake libtool git curl
#             (or equivalent for your distro)
#
# Usage:
#   bash scripts/build-nec2c.sh

set -e

# Never prompt for credentials — if a download fails, surface the error
export GIT_TERMINAL_PROMPT=0

# Canonical nec2c source — Neoklis Kyriazis (5B4AZ).
# Primary: tarball from qsl.net; secondary: public GitHub mirror.
TARBALL_URL="https://www.qsl.net/5b4az/pkg/nec2/nec2c/nec2c-1.3.tar.bz2"
MIRROR_GIT="https://github.com/jeikabu/nec2c.git"

BUILD_DIR=".nec2c-build"
OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/NEC"

echo "[build-nec2c] Cleaning previous build..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

# Try tarball first — most stable, no git auth needed
if command -v curl >/dev/null 2>&1; then
    DL="curl -fsSL -o nec2c.tar.bz2"
elif command -v wget >/dev/null 2>&1; then
    DL="wget -qO nec2c.tar.bz2"
else
    echo "[build-nec2c] ERROR: need curl or wget installed" >&2
    exit 1
fi

echo "[build-nec2c] Downloading source from $TARBALL_URL ..."
if $DL "$TARBALL_URL" 2>/dev/null && [ -s nec2c.tar.bz2 ]; then
    tar xjf nec2c.tar.bz2
    SRC_DIR="$(find . -maxdepth 1 -type d -name 'nec2c-*' | head -1)"
else
    echo "[build-nec2c] Tarball download failed, falling back to git mirror..."
    if ! git clone --depth 1 "$MIRROR_GIT" nec2c-git 2>&1; then
        echo "[build-nec2c] ERROR: could not fetch nec2c source from either tarball or mirror." >&2
        echo "[build-nec2c] Manual fix: download nec2c-1.3.tar.bz2 yourself, extract to .nec2c-build/, and re-run." >&2
        exit 1
    fi
    SRC_DIR="nec2c-git"
fi

cd "$SRC_DIR"
echo "[build-nec2c] Configuring..."
if [ -f autogen.sh ]; then
    bash autogen.sh
elif [ ! -f configure ]; then
    # Tarball usually ships a pre-built configure; if not, bootstrap with autoreconf
    autoreconf -fi
fi
./configure

echo "[build-nec2c] Compiling..."
make -j"$(nproc 2>/dev/null || sysctl -n hw.logicalcpu 2>/dev/null || echo 2)"

BINARY="$(find . -maxdepth 3 -type f -name 'nec2c' -perm -u+x 2>/dev/null | head -1)"
if [ -z "$BINARY" ]; then
    BINARY="$(find . -maxdepth 3 -type f -name 'nec2c' | head -1)"
fi
if [ -z "$BINARY" ]; then
    echo "[build-nec2c] ERROR: binary not found after build" >&2
    exit 1
fi

cd "$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$OUT_DIR"
cp "$BUILD_DIR"/*/nec2c "$OUT_DIR/nec2c" 2>/dev/null || \
    cp "$(find "$BUILD_DIR" -name nec2c -type f | head -1)" "$OUT_DIR/nec2c"
chmod +x "$OUT_DIR/nec2c"
rm -rf "$BUILD_DIR"

echo "[build-nec2c] Done — NEC/nec2c is ready"
file "$OUT_DIR/nec2c" 2>/dev/null || true
