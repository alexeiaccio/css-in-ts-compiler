#!/bin/sh
# The browser target's wasm: Clay + the generated Sensors page. Output goes outside the repo; nothing here is committed
# except this script, because page.wasm is a build product.
#   sh browser/build.sh [out.directory]      -> <out>/page.wasm (default ${TMPDIR:-/tmp}/cssints-native-web)
# Needs zig (wasm32-wasi libc, no emscripten) and node --conditions=development for the cssints plugin.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-${TMPDIR:-/tmp}/cssints-native-web}"
mkdir -p "$OUT"

# styles.h is the same header generator/clay-header.ts gives the C page on every target
node --conditions=development "$ROOT/generator/clay-header.ts" "$ROOT/examples/sensors/styles.ts" "$OUT/styles.h"

# A reactor (not a command) module: _initialize runs libc's constructors, and the exports are init/frame/cmds. No
# imports at all, so the page needs no WASI shim; measure is the only one (env.measure, from render.js). The page is the
# generated state machine (--events): the wasm keeps the state and a press/release asks its table.
zig cc -target wasm32-wasi -mexec-model=reactor -Oz -Wall -Wno-unused-function -Wno-missing-field-initializers \
  -Wno-unused-variable -I "$OUT" -I "$ROOT/vendor/clay" -I "$ROOT/generator" \
  "$ROOT/browser/page.c" "$ROOT/examples/sensors/page_generated_events.c" \
  -Wl,--strip-all -o "$OUT/page.wasm"

echo "$OUT/page.wasm ($(wc -c < "$OUT/page.wasm" | tr -d ' ') bytes)"
