# Token files from Figma tools

Small samples of what Figma tooling exports, for `test/importers.mjs` (docs/API.md, "JSON from Figma"). Checked 2026-10-09.

- `figma-light.tokens.json`, `figma-dark.tokens.json`, `figma-boolean.tokens.json`: Figma's native variable export
  (Variables view, Export modes: one DTCG file per mode). The shape (colour objects with `hex`, `com.figma.*` extensions,
  `com.figma.modeName` at the root, the boolean extension) follows the example of the Figma Help Center article
  "Modes for variables" (https://help.figma.com/hc/en-us/articles/15343816063383); the token names and the first colour
  are the article's, the rest is ours.
- `tokensbruecke-modes.tokens.json`: TokensBrücke (https://github.com/tokens-bruecke/figma-plugin, MIT), modes in
  `$extensions.mode`, after the "Tokens structure" example of its README.
- `tokens-studio-legacy.json`: Tokens Studio's legacy format (`value`/`type`, a single file with `$themes` and
  `$metadata`), trimmed from `examples/tokens-examples/tokens-studio-2.json` of TokensBrücke (MIT).
- `tokens-studio-dtcg.json`, `tokens-studio-types.json`, `tokens-studio-modify.json`, `tokens-studio-math.json`:
  Tokens Studio in its W3C DTCG format: a single-file export, its own `$type` names, a colour modifier and math, after the
  examples of @tokens-studio/sd-transforms' README (https://github.com/tokens-studio/sd-transforms, MIT).
