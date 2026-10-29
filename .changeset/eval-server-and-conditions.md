---
"cssints": minor
---

The library is imported by a subpath that cannot resolve to a browser build (`cssints/eval`), and a runner whose ssr
environment is not one (vitest's browser mode puts `browser` in its conditions) gets an evaluation server of the plugin's own,
with the app's aliases, dedupe, conditions and `noExternal`; `cssints({ evaluation: { inline: [...] } })` names what a framework
needs inlined when that environment inlines everything. A styled component — `cv()`, tokens, `attr()`/`within()` and `render` —
now runs its browser test in vitest, which it could not before.
