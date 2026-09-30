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

## Old browsers (cssints-fxz3, plugins.md §3.6)

Playwright's Firefox and WebKit builds are pinned to a Playwright release, so each old build is driven by the `playwright-core` of its own release. Scratch install outside the repo (nothing is added to package.json):

```sh
S=/tmp/old; mkdir -p $S/browsers; export PLAYWRIGHT_BROWSERS_PATH=$S/browsers
for v in 1.46.1 1.60.0 1.40.1 1.36.2 1.33.0; do (mkdir -p $S/pw-$v && cd $S/pw-$v && npm init -y >/dev/null && npm i playwright-core@$v); done
# Firefox 128.0 (ESR, Playwright 1.46.1, build 1458) and 150.0.2 (the newest below 151, Playwright 1.60.0, build 1522)
(cd $S/pw-1.46.1 && node node_modules/playwright-core/cli.js install firefox)   # https://playwright.azureedge.net/builds/firefox/1458/firefox-mac-arm64.zip (mirror: playwright-akamai.azureedge.net)
(cd $S/pw-1.60.0 && node node_modules/playwright-core/cli.js install firefox)   # https://cdn.playwright.dev/dbazure/download/playwright/builds/firefox/1522/firefox-mac-arm64.zip
# WebKit 17.4, 17.0, 16.4: the installer would pick the mac15 build, which does not exist for these, so unzip by hand
for x in "1944 mac-13-arm64" "1869 mac-13-arm64" "1837 mac-12-arm64"; do set -- $x
  mkdir -p $S/browsers/webkit-$1 && curl -sL https://playwright-akamai.azureedge.net/builds/webkit/$1/webkit-$2.zip -o $S/w.zip \
    && unzip -q -o $S/w.zip -d $S/browsers/webkit-$1 && touch $S/browsers/webkit-$1/INSTALLATION_COMPLETE; done
# 1944 = WebKit 17.4 (Playwright 1.40.1), 1869 = 17.0 (1.36.2), 1837 = 16.4 (1.33.0); the akamai host serves all of them, cdn.playwright.dev does not
# NOT old enough: webkit 2003 (Playwright 1.44.1, "17.4", April 2024) already has style queries, the probe says so

# a reference from a browser that HAS style queries (once per engine), then the same test on the old one:
DUMP=/tmp/old/ref-chrome.json node test.mjs
DUMP=/tmp/old/ref-firefox155.json BROWSER=firefox node test.mjs        # Playwright's own Firefox 155 (main checkout install)
DUMP=/tmp/old/ref-webkit26.json BROWSER=webkit node test.mjs
PW=$S/pw-1.46.1/node_modules/playwright-core/index.mjs BROWSER=firefox REF=$S/ref-firefox155.json node test.mjs
PW=$S/pw-1.40.1/node_modules/playwright-core/index.mjs BROWSER=webkit  REF=$S/ref-webkit26.json  node test.mjs
# probe / controls / bench take the same PW and BROWSER; REF against the Chrome dump from another engine needs TOL=0.1 (oklch hue differs by up to 0.1 at chroma 0.02)
```

`PW` is the `index.mjs` of the `playwright-core` to use (`lib.mjs` imports it, default: the main checkout's 1.63). `REF` replaces the style-query page (an old browser has none) with values dumped by `DUMP`; with `REF` the test also fails if the probe did not switch the runtime on. The sq column of `bench.mjs` on an old browser measures an unstyled page, ignore it. `controls.mjs` on an old browser prints 0px / transparent for its `sq` page, which is the feature missing.

Run with `BROWSER=chrome|firefox|webkit node test.mjs`. Imports use absolute paths into the main checkout's `node_modules/.bun/node_modules` (worktrees have no `node_modules`); adjust `lib.mjs`, `size.mjs` on another machine. Files carry `oxlint-disable` so `vp check` stays quiet.
