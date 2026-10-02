---
# cssints-l90l
title: check.contrast reads a derived token as its default value under every theme
status: completed
type: bug
priority: normal
created_at: 2026-10-02T14:51:08Z
updated_at: 2026-10-02T15:06:03Z
parent: cssints-co8y
---

Found in cssints-hbqf. contrast.ts follows \`alias\` only. A derived token (\`refs\`, a \`$value\` with \`{path}\` inside a CSS value) has \`TokenDef.value\`, the literal with its references already replaced by the targets' default literals, and no alias. So:

- the default values are read from that literal: exact for \`oklch({tone.l} 0 0)\`, a warning for \`color-mix(in oklab, {color.base}, black 15%)\`;
- a theme that sets a token the derived one refers to is not a subject (\`affecting\` is built from alias chains), and where a theme is a subject for another reason the derived token still reads its default literal. Probe: \`fg: oklch({tone.l} 0 0)\` with \`tone.l\` 0.2, a theme \`.x\` with \`tone.l\` 0.95, \`check.contrast(fg, bg, { min: 4.5 })\` on white: the check passes in silence, and the real ratio under \`.x\` is about 1.1.

Fix: keep the template and the refs on \`TokenDef\`, let \`affecting\` follow refs, and let \`valueOf\` substitute the theme's values (or a theme's own value) into the template: exact for readable results, a warning "in theme .x" for color-mix and relative colours. Touches theme.ts (cssints-q6l0 works there).

## Summary of Changes

TokenDef now keeps `template` (the value with `var(--target)` per reference) and `refs` for aliases and derived tokens, replacing `alias`. contrast.ts substitutes the theme's values (else the base's) into the template, recursively, and `affectedBy` follows refs, so a theme that sets any token a checked colour depends on is checked. Theme overrides with references need no extra field: their text already holds `var(--target)` and is substituted the same way (cssints-q6l0 side). Unreadable results (color-mix, light-dark) stay warnings that name the theme. Tests: fixtures themes-contrast-derived-{fail,pass,chain}.ts in themes.mjs; the fail test failed before the fix. API.md updated.
