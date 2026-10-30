#!/bin/sh
# What the native targets share with a machine that has no SDL, ThorVG or browser: the C side (check.sh: the generator
# against the C the repository commits, byte for byte) and the two parts that are plain node — the focus manager's walk,
# and the headless widgets against their Quint scenarios. test.sh is the whole suite, on a Mac with brew's SDL3 and ThorVG;
# this is what CI runs (.github/workflows/native.yml).
set -e
cd "$(dirname "$0")"
sh check.sh
# the focus manager (no DOM): Tab order, roving focus, restore, and a seeded random walk
node focus/test/focus.test.ts
# headless widgets (button, switch, checkbox, disclosure) on neutral parts: ported scenarios and a walk against the models
(cd headless && bun run typecheck:native && bun run test:native)
echo "native: the C side, the focus manager and the headless widgets are green"
