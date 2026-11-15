#!/usr/bin/env bash
# Tarayıcı önizlemesi için Rust motorunu WebAssembly olarak derler ve ui/engine/ altına kopyalar.
set -euo pipefail
cd "$(dirname "$0")/.."
rustup target add wasm32-unknown-unknown >/dev/null 2>&1 || true
cargo build --release -p uhd-wasm --target wasm32-unknown-unknown
mkdir -p ui/engine
cp target/wasm32-unknown-unknown/release/uhd_wasm.wasm ui/engine/uhd_engine.wasm
echo "ui/engine/uhd_engine.wasm hazır ($(wc -c < ui/engine/uhd_engine.wasm) bayt)"
