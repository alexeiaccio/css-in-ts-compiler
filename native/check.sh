#!/bin/sh
# The Clay headers, with nothing to draw on: a Solid styles module to a header, and the C that uses it compiled and run.
# Any machine with node, bun and cc runs it — no SDL3, no ThorVG, no browser: test.sh calls it first and then the targets that
# draw, ci.sh calls it on its own.
set -e
cd "$(dirname "$0")"
CLAY_H="${CLAY_H:-$PWD/vendor/clay}"
OUT="${NATIVE_OUT:-${TMPDIR:-/tmp}/cssints-native-check}"
mkdir -p "$OUT/sensors" "$OUT/sensors-gen"
node --conditions=development generator/clay-header.ts examples/units/styles.ts "$OUT/styles.h"
cc -std=c99 -I "$OUT" -I "$CLAY_H" examples/units/same.c -lm -o "$OUT/same"
"$OUT/same"
# the Sensors header (a state, a theme, fonts) against the same clay.h
node --conditions=development generator/clay-header.ts examples/sensors/styles.ts "$OUT/sensors/styles.h"
cc -std=c99 -Wall -Wno-unused-variable -I "$OUT/sensors" -I "$CLAY_H" examples/sensors/header.c -lm -o "$OUT/header"
"$OUT/header"

echo "c: the headers and the C against them are current"
