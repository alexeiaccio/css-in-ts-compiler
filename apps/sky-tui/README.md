# sky-tui

apps/sky in a terminal: the home feed with its tabs, the post card and the thread, on
[OpenTUI](https://opentui.com) and Solid. It reads the public Bluesky AppView, with no login.

```bash
bun run build          # vp build: dist/main.js, one file
bun run start          # bun dist/main.js: the terminal's own colours (--light, --dark: the app's themes)
```

Keys: `j`/`k` or the arrows move the selection, `enter` opens a thread, `esc` goes back, `tab` and
`shift-tab` (or `1`-`3`) switch the feed, `t` switches the theme, `q` quits. Mouse: a click opens a
row, the wheel scrolls, and the row under the pointer is highlighted (with a pointer cursor where
the terminal supports OSC 22).

## How it is built

- `@opentui/solid` needs solid-js 1.9.12, so this app has its own solid-js, not sky's 2.0 rc.
- `vite.config.ts`: a plain SSR build (`build.ssr: "src/main.tsx"`), vite-plugin-solid with
  `generate: "universal"` and `moduleName: "@opentui/solid"`, and `solid-js` aliased to its client
  build (the copy that `@opentui/solid` imports). Everything is bundled except `@opentui/core`,
  which loads a native library. `@cssints/tui` is aliased to its source: it has no `dist/` in the
  repository.
- Shared with apps/sky by relative import, with no Solid in them: `src/api.ts`,
  `src/post/model.ts`, `src/thread/model.ts`, `src/home/feeds.ts`.
- `src/styles.ts` holds every style, written with `cssints/tui`: the colour tokens
  (`createTokens`, dark by default) and the `light` theme (`createGlobalTheme`), `css.hover()`,
  `css.focus()` and `css.cursor("pointer")`. The cssints plugin compiles each one to a prop object.
  The components put them on renderables with `use()` of `@cssints/tui/opentui`
  (`<box {...use(s.bar)}>`), which follows the mouse, the focus and the theme. `t` and `--light`
  call `setTheme`.
- `src/system.ts` is the default theme, the system theme of `@cssints/tui/system`: each token is
  a role (`text` from the terminal's foreground at 7:1 on the panels, `accent` from its blue at
  3:1, `card` 1.1:1 from its background, ...), solved from the palette OpenTUI reads
  (`followSystemTheme` in `main.tsx`, before the first frame, at most 100 ms). A light terminal
  gets the `light` theme under it; a terminal that answers nothing draws its own ANSI colours.
- The selected row has the keyboard focus (`focusable`, `focus()`), so its accent border is the
  `:focus` of its style, as drawn. `<span>` and `<a>` take their style with `use()` too: the props
  and the theme (a text node has no mouse events and no focus, so no states).

### Workarounds (bugs in cssints-06ws)

- A renderable keeps the style it was attached with (cssints-332g): the active tab is a second
  style, and `Tab` in `App.tsx` makes the tab again (`<Show>`) when it turns active.

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
`j`/`k` (the focus and the border as drawn), `enter` and `esc`, `tab`, a mouse over a row (the
highlight and the pointer) and a click, the wheel, and the theme both ways; then the system
theme on a fake terminal (a TTY stdin, and each OSC 4/10/11 query answered with Gruvbox dark):
the card, the background and the accent border from the palette, and after a mode 2031
notification and Catppuccin Latte's replies, the light ones. If Bun
is not installed, the Bun part is skipped with a message.
