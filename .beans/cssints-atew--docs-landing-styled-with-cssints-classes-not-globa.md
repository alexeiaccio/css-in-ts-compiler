---
# cssints-atew
title: Docs landing styled with cssints classes, not global rules
status: completed
type: task
priority: normal
created_at: 2026-10-10T22:04:01Z
updated_at: 2026-10-10T22:55:20Z
---

User (2026-10-11): make the landing page on cssints too. Today plugin/landing.ts writes an html string with plain class names and src/landing-styles.ts styles it with ~50 global() rules under .landing. Make it like the rest of the site: classes from css.cn in a cssints module, one source of html for the client and the prerender.

- [ ] src/landing/page.ts (cssints module): the cn classes (from landing-styles.ts, same tokens/look) and `landing(data)` returning the html with those classes; Shiki's <pre> gets a class by replace or a transformer
- [ ] plugin/landing.ts: the private server evaluates page.ts (ssrLoadModule / runner, through the cssints plugin) for the prerendered document; the virtual module imports page.ts so the classes are in the build's sheet and the client renders the same string
- [ ] landing-styles.ts removed (or only what cannot be a class), import dropped from index.tsx
- [ ] tests (build.mjs, browser.mjs) on stable markers instead of the old class names; prerendered html equals the client's
- [x] checks green (the deploy is the coordinator's, after the merge)
- [x] Task 2: a shader behind the hero (shaders 4.0.4, MeshGradient, lazy, palette colours, silent fallback, credit in README)

## Summary of Changes

- `src/landing/page.ts` (new): the landing's classes as `css.cn` (tokens of theme.ts, `gtSidebar`, hover and focus-visible as conditions, same look as the old ~50 `global()` rules) and `landing(data)`, which returns the html. Shiki's `<pre>` gets its class by a replace of `<pre class="`; inline `code` and every element have their own class, so no element selectors are left. `landing-styles.ts` and its import are gone (no `global()` remains).
- Prerender: the ssr environment of the cssints plugin only evaluates sites (its `cn()` is a node there, `${root}` printed `[object Object]`); the class strings are what the client environment's transform makes. So plugin/landing.ts takes `transformRequest("/src/landing/page.ts")` from its private server (no import is left in it) and imports that code from a data URL. The virtual module `virtual:docs/landing` imports page.ts and calls `landing(data)` with the same data (JSON of the Shiki html, the base, the error), so the sheet of the build has the classes and the app renders the same string.
- Markers for tests: `data-landing`, `data-hero`, `data-panels`, `data-features`, `data-primary`, `data-error`, `data-shader`. build.mjs also checks that every cssints class of the prerendered html is in the sheet; browser.mjs checks that the app's landing equals the document's (but the shader's layer).
- Shader (task 2): `shaders` 4.0.4 (MIT, pinned, apps/docs dependency), `MeshGradient` from `shaders/js` `createShader`, slow (speed 0.3, swirl 0.2), stops bg to accentSoft read from `--color-bg` and `--color-accent-soft` at mount and again on any attribute change of <html> and on a change of the system scheme. The component's default stops are a loud five-colour ramp and beat colorA/colorB, so the stops are set. A layer behind the hero (masked, `aria-hidden`, `data-shader`) holds the canvas; the mask is on the layer because Chrome did not apply it to the WebGPU canvas. Contrast: text and textMedium on accentSoft are measured in contrast.mjs for every palette, hue and mode (worst 4.81) and checked in theme.ts.
- Rules kept: client only, `src/landing/shader.ts` is a dynamic import of Landing.tsx and `shaders/js` a dynamic import inside it, after the checks for `prefers-reduced-motion`, no `navigator.gpu` and a failing `createShader` (the layer goes, silent); telemetry off; destroyed with the landing's effect cleanup. Chrome here has WebGPU, so the test runs both paths: the shader (canvas, `aria-hidden`, a mode toggle, no console error) and without it (reduced motion, no WebGPU).
- Sizes: entry chunk 81062 to 81224 bytes (+162; master's last build and this one). The lazy chunks: shader.ts 1.3 kB, and `shaders/js` 2.56 MB (705 kB gzip), because createShader imports the registry of all 200+ components; only a browser with WebGPU and no wish for less motion loads it.
- Credit: README Credits, "Built on".
- Not done: AGENTS.md still names landing-styles.ts in the apps/docs line (master edits that line too); the deploy.
