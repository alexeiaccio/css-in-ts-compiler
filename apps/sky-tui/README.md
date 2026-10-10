# sky-tui

apps/sky in a terminal: the home feed with its tabs, the post card and the thread, on
[OpenTUI](https://opentui.com) and Solid. It reads the public Bluesky AppView, with no login.

```bash
bun run build          # vp build: dist/main.js, one file
bun run start          # bun dist/main.js (add --light for the light theme)
```

Keys: `j`/`k` or the arrows move the selection, `enter` opens a thread, `esc` goes back, `tab` and
`shift-tab` (or `1`-`3`) switch the feed, `t` switches the theme, `q` quits. Mouse: a click opens a
row, the wheel scrolls, and the row under the pointer is highlighted (with a pointer cursor where
the terminal supports OSC 22).

## How it is built

- `@opentui/solid` needs solid-js 1.9.12, so this app has its own solid-js, not sky's 2.0 rc.
- `vite.config.ts`: vite-plugin-solid with `generate: "universal"` and
  `moduleName: "@opentui/solid"`, and `solid-js` aliased to its client build (the copy that
  `@opentui/solid` imports). Everything is bundled except `@opentui/core`, which loads a native
  library. The build is a Vite environment named `tui`, not `ssr`: cssints makes the JSX of the
  `ssr` environment inert. The cssints plugin is in the config, but no styles use it yet.
- Shared with apps/sky by relative import, with no Solid in them: `src/api.ts`,
  `src/post/model.ts`, `src/thread/model.ts`, `src/home/feeds.ts`.
- `src/styles.ts` holds every style as plain OpenTUI `style` objects, plus `hoverable()`. This is
  the module that changes when cssints gets a TUI target (cssints-m0yj).

## Limits

No images (an embed is a line of text, and a quote is a box), no profiles, no reveal for posts
with a warning, no HMR in the terminal.

## Tests

```bash
bun run test           # node test/build.mjs: the build check, then bun test/screens.mjs
bun run typecheck
```

`test/screens.mjs` imports the built `dist/main.js` under Bun and renders it on OpenTUI's test
renderer (100x40), with apps/sky's recorded fixtures in place of the network. It checks the feed,
`j`/`k`, `enter` and `esc`, `tab`, a mouse over a row and a click, the wheel, and the theme. If Bun
is not installed, the Bun part is skipped with a message.
