# plugins-proto

Throwaway proof for `docs/research/plugins.md` (cssints-rq2r): the runtime polyfill for `frame()`/`surface()` on targets without `@container style()`. Not product code; nothing imports it.

| File                                 | What                                                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `engine.js`                          | the runtime: probe, level-by-level parent copy, MutationObserver, transition sentinel                 |
| `kernels/frame.css`, `surface.css`   | style-query kernels (surfaces-frames.md §2), custom properties renamed per feature (`--_f*`, `--_s*`) |
| `kernels/*.fallback.css`, `poly.css` | fallback rules, scoped under `:root[data-cssints-poly]`, and the `_w` transition rule                 |
| `test.mjs`                           | equivalence: style-query page against fallback page, 22 elements, 10 steps                            |
| `controls.mjs`, `probe.mjs`          | negative controls; probe shapes                                                                       |
| `bench.mjs`, `size.mjs`              | cost on nested trees; min + gzip + brotli                                                             |
| `types/`                             | the plugin types over `packages/css-grammar/src/css.ts` (`tsgo -p types/tsconfig.json`)               |
| `results.txt`                        | output of all of the above, Chrome 154, Firefox 155, WebKit 26.6                                      |

Run with `BROWSER=chrome|firefox|webkit node test.mjs`. Imports use absolute paths into the main checkout's `node_modules/.bun/node_modules` (worktrees have no `node_modules`); adjust `lib.mjs`, `size.mjs` on another machine. Files carry `oxlint-disable` so `vp check` stays quiet.
