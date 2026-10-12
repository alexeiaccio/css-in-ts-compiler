# @cssints/devtools

A dev overlay inspector for cssints, built on what the dev server knows of every class: an element's classes grouped
by the `css.*` call that made them, the winner per property by the sheet's own rules (layer, specificity, order, the
conditions that hold now), and each winner checked against the browser's computed style.

```ts
// vite.config.ts of the app; @cssints/devtools in its devDependencies
import cssints from "cssints/vite";
import { defineConfig } from "vite";

export default defineConfig({ plugins: [cssints({ devtools: true })] });
```

Alt+Shift+C or the `cssints` button (bottom right) opens it. Hover previews an element, a click picks it; ↑ parent,
↓ first child, ← → siblings; Esc stops picking, then closes. The four buttons in the panel header (◧ ⬒ ⬓ ◨) dock it
left, top, bottom or right (the default); drag the strip on its inner edge to resize it (at least 200 px, and a strip of
the page stays). The side and the two sizes are kept in `localStorage` (`cssints-devtools:dock`) per origin. The panel
covers the page beside it, and picking works on the rest of the page; the page is not pushed aside. The ⧉ button detaches
the panel into a window of its own (`window.open`, a same-origin pop-up, not the Document Picture-in-Picture API: that
one is Chromium only). It is the same panel: the page keeps picking (hover, click, the highlight) and the window follows
the picked element live. Closing the window, ⧉ again or a dock button puts the panel back; Esc and the `cssints` button
close both. The choice is kept with the dock, and the next open (a click or the shortcut: a pop-up needs one) opens the
window again. If the browser blocks the pop-up, the docked panel says so. The panel and the cascade rule are described in
docs/API.md, "Debugging: the devtools overlay"; the design in docs/research/devtools.md, "Our devtools".

## Rules

- **Dev only, unless asked.** `devtools: true` adds a plugin with `apply: "serve"`: an HTML script tag, the module
  `virtual:cssints/devtools` and two HMR events (`cssints:devtools:get` → `cssints:devtools`, and
  `cssints:devtools:stale` after each transform). A build has none of it.
- **In a build: `devtools: "build"`.** The table is a JSON asset, the overlay a chunk of its own, and the entry holds a loader
  (a `cssints` button and Alt+Shift+C). The first open loads both; a call shows as `file:line` and its source, with no link
  to an editor. The table has no path of the machine that built it. Sizes are logged by the build (this site: table 70 kB,
  overlay 190 kB, the entry +0.85 kB).
- **Readable classes, dev only.** The dev server adds `cs-<owner>[-<label>]` to each `cn(...)` and `cv({...})`:
  `const logo = cn(...)` inside `function Landing()` gives `cs-Landing-logo`, at the top of `landing/page.ts`
  `cs-page-logo`, `<div class={cn(...)}>` in `Button` `cs-Button`. The panel shows it first in its bar and in the hover
  tag; the prompt's `Classes:` line lists it. It is not in the table, the sheet or the hashes, and a build has none.
  docs/API.md, "Debugging: the devtools overlay".
- **The data is the compiler's.** The table holds the sheet as the server renders it, each class's rule, plugin,
  tokens and sites, and the place of every call. The core parses the sheet; it never reads the page's CSSOM for
  cssints' rules.
- **The browser decides the conditions.** At-rules (`@media`, `@container`, `@supports`, `@scope`) are evaluated for
  the element by a probe sheet; states by `Element.matches`.
- **A winner is checked, not claimed.** A childless clone in place gets the winner inline; when its computed value
  differs, the panel names the cause (inline style, a rule of another sheet, an unlayered rule, an animation) or marks
  a layout-dependent value as unverified. A custom property is checked with its declaration as the page's sheet has
  it, since a transformer (LightningCSS) reprints it and an unregistered one computes to its tokens as written.
- **Isolated.** A custom element with a shadow root and its own cssints sheet, built ahead into `dist/overlay.js`
  (Solid, Effect and the core bundled): an app needs neither Solid nor a second CSS file. No tokens in its styles:
  `@property` is ignored inside a shadow root.

## Ask OpenCode

```ts
// dev only, off by default; @opencode/client in the app's devDependencies
cssints({ devtools: true, opencode: true });
cssints({ devtools: true, opencode: { agent: "build", skills: ["cssints"] } });
```

The panel has an OpenCode box whenever the option is on, picked element or not. It is pinned: at the bottom of the panel in
a left or right dock, at its right edge (20 rem wide, to the right of the inspection) in a top or bottom dock, and in the
detached window by the window's shape (wider than tall: the right edge); the inspection beside it scrolls, the box does not.
The box has a title row (`OpenCode`, and a dot with `connected` or `not connected`), the input (Enter sends, Shift+Enter is a
new line) and one status line:

- Not connected: how to connect. Start OpenCode (or `opencode serve --service`) and run `/cssints-devtools` in a session; the
  dev server finds the running service by itself; a prompt without an attached session opens a new one in the repository
  folder; `@opencode/client` must be in the app's devDependencies. When the server has its own message (the client is not
  installed), it follows.
- Connected: `connected to <service address> · attached session <id> · <state>`, or `no session attached: a prompt starts a
new one`. The id is the session `/cssints-devtools` attached to this dev server (truncated; the full id is the title); the
  state is `running`, `completed`, `failed` or `interrupted`.

The page asks the dev server whether a service is found (a probe: it looks, it creates no session) when the panel opens, when
the box gets focus and after a send that found none, so starting OpenCode later shows up without a reload.

### The command `/cssints-devtools`

The box does not choose a session: an OpenCode command attaches the session it runs in to a dev server. The plugin is the
main entry of this package, so OpenCode loads it by the package name (checked on 2.0.27: it installs the package and finds
the entry; a package subpath, `@cssints/devtools/opencode`, is not loaded as a plugin):

```jsonc
// opencode.jsonc of the repository of the app (or ~/.config/opencode/opencode.jsonc)
{ "plugins": ["@cssints/devtools"] }
```

Or, with the package installed in the app, a file of the repository (OpenCode loads the `.ts` files of `.opencode/plugins/`):

```ts
// .opencode/plugins/cssints-devtools.ts
export { default } from "@cssints/devtools/opencode";
```

Then, in an OpenCode session:

- `/cssints-devtools`: one dev server of this repository with `opencode` on runs: this session is attached to it. Several
  run: they are listed (id, address, root) and none is attached. None: it says so.
- `/cssints-devtools <id or part of it>` picks one (the id is the Vite root relative to the repository, `/` as `-`, so
  `docs` picks `apps-docs`); `/cssints-devtools off [id]` detaches this session (or that server).

Each outcome is a message in the session (`ctx.session.synthetic`, which also gives the model a turn to acknowledge it). The
prompts of an attached server's panel are sent to that session, which is not created again; a session that is gone makes the
send fail with a message that says to run `/cssints-devtools` again. The rendezvous is files, not a route (the ask channel is
the HMR socket, which Vite's token protects): `<repository>/node_modules/.cache/cssints-devtools/<id>.json` (`root`, `pid`,
`url`) is written by the dev server while it runs, and `<id>.session.json` by the command. A dev server that crashed leaves a
file with a dead pid, which the command ignores and removes. The plugin imports `cssints/devtools-link`, the module both
sides share.

Without an attached session, Enter starts a session on the running OpenCode V2 service (`Service.discover` of
`@opencode/client`; the page never talks to it) in the nearest folder up from the Vite root that has a `.git`. The prompt is built by `src/core/prompt.ts`:

- `App:` (added by the dev server, on top): the Vite root relative to the repository (`.` when it is the repository) and the
  address the server listens on, as file paths in the prompt are relative to that root;
- your instruction, then `Page:` (path, query and hash, not the origin), `Title:` and `Display:` (viewport and pixel ratio,
  the `class` and `data-*` attributes of `<html>`, `prefers-color-scheme` and `prefers-reduced-motion`; with an element, its
  rendered size and position and whether it is hovered, focused or disabled);
- with an element picked: its tag, DOM path, text, classes, `id`, `role`, `aria-label`, `href`, `src`, `alt`, `type`, `name`,
  `placeholder` and `title`, the `data-*` attributes of it and of its three nearest ancestors, the `css.*` calls that style it
  (`file:line` and the call's source), the winner of each property and what it beat, and the tokens it reads. Never a `value`,
  a cookie or storage.

Every list and value is cut, the server cuts the whole at 16,000 characters from the end (the `App:` line, the instruction
and the header come first and stay). With no service running the box says how to connect and keeps your text. The
page and the server talk over the HMR channel (`cssints:devtools:ask`, `asked`, `link`, `linked`), not a route. A build has
none of it. The idea, and the calls to the V2 client, follow
[brendonovich/vite-plugin-opencode](https://github.com/Brendonovich/vite-plugin-opencode) (MIT, Brendan Allan), which marks the
markup with Babel and so needs no table; here the table is the context.

## Layout

- `src/core`: Effect code, no overlay in it (an extension could host it): `table.ts` (the decoded table and its
  model), `css.ts` (sheet parser, specificity, states), `cascade.ts` (`inspect`), `page.ts` (the `Page` service),
  `dom.ts` (its browser layer), `session.ts` (the protocol and the state), `prompt.ts` (the prompt for OpenCode).
- `src/ui`: the Solid overlay (`overlay.tsx`, `mount`) and its cssints styles (`styles.ts`).

## Browsers

Chrome, Firefox and WebKit, checked by `test:browsers` on apps/demo's dev server.

## Limits

- `@scope` proximity is not ranked; a logical and a physical property are two properties.
- An element inside another shadow root is picked as its host.
- A page that Vite does not serve as HTML (server rendering) gets no entry.
- A reload closes the window; in the `"build"` mode the panel opens without a click, so a kept window is blocked until the
  next click on ⧉. Only one window is kept. The window has no Document Picture-in-Picture variant.
- The panel does not float and has no shortcut to switch the dock; it covers the page where it sits, so an element under
  it is picked from the arrow keys or after a dock to another side.
- The panel re-inspects every 600 ms while open: each pass adds and removes a probe `<style>` and attribute.

## Credits

The prompt box that starts an OpenCode session follows
[brendonovich/vite-plugin-opencode](https://github.com/Brendonovich/vite-plugin-opencode) (MIT, Brendan Allan): the idea and
the calls to the V2 client. No code is copied. The overlay is built with [Solid](https://www.solidjs.com) (MIT).

## Tests

```bash
bun run test            # test/core.mjs (the cascade on happy-dom: hover vs media, @container, @supports, @scope,
                        # an unlayered rule, frame's kernel, within(), grouping), test/build.mjs (nothing in a build
                        # without the option; with "build": the table, the lazy chunk, the loader's size; apps/docs/test/browser.mjs opens it in Chrome),
                        # test/opencode.mjs (the dev server and a fake OpenCode service: the prompt as sent, the agent, the directory, the status, no service; the link probe, with and without the service and the client; an attached session, a detached one, two dev servers, a session that is gone, stale files),
                        # test/opencode-plugin.mjs (the command on a fake plugin context: none, one, several, a pick, off, a stale pid)
bun run test:browsers   # builds dist/overlay.js, then the demo in Chrome, Firefox and WebKit (test/browsers.mjs; each dock: the panel on its side, a pick beside it, a drag of the grip, the button after Esc, the dock and sizes after a reload; detach: the pop-up with the panel, a pick in the page followed live, the choice after a reload, closing re-docks, a blocked pop-up), then the OpenCode box in Chrome (test/ask-browser.mjs: with nothing picked, pinned in each dock and in the window, the connect text, a service started later found on focus, the attached session and its title; screenshots in test/out/)
```
