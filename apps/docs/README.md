# cssints docs

The documentation site: pages from `README.md` and `docs/API.md`, built with Solid 2 and cssints. Commands are in `AGENTS.md`.

## Playground

`/playground` runs the engine in the browser: Monaco with the TypeScript worker and the types of cssints (hover, completion, type errors of the open file), several files that import each other (`import { t } from "./tokens.ts" with { type: "cssints" }`), the plugin packages that run without Node (`@cssints/fluid`, `layout`, `motion`, `tokens/*`, ...; not `fonts`, `icons`, `placeholder`, which read files), the CSS, the module as the plugin returns it, a live preview, errors at their position, all the files in the URL hash. It is a lazy chunk and three workers (`src/playground/`); `plugin/playground.ts` makes what the engine imports from Node (SHA-1, `path`, `createRequire`, `browserslist`, the browser-compat data), routes the parsers to their wasm builds, and collects the types and the sources of the packages. How and why: `docs/research/playground.md`. It opens a slice of csssky (`examples/csssky`: tokens and themes, the shell, a feed of post cards, posts from csssky's recorded fixtures) and has a picker of the example projects of `examples/`: one directory per docs page (its slug, the entry `index.ts(x)`), which the page links to with "Open in playground" (`#example=<slug>`; a page with nothing a browser could run has none: the list is in `test/playground.mjs`). A project that does not call `reset()` gets the reset of `@cssints/reset` in the preview, with a switch. `node test/playground.mjs` compares the engine with the Node plugin (every example included) and drives the page in Chrome.

## TUI

`/tui` is a live terminal: ghostty-web (Ghostty's emulator compiled to WASM) runs csssky's home feed and thread on `@bomb.sh/tty`, with the styles and the system theme of `apps/csssky-tui` and the posts of csssky's recorded fixtures (no request). Keys and the mouse work. The page plays the terminal's side (`src/tui/host.ts`): it answers the app's colour queries from the display settings and reports their changes, so the terminal theme follows the palette and the mode. A lazy chunk and two `.wasm` files (`src/tui/`, `plugin/tui.ts`). `node test/tui.mjs` drives it in Chrome. OpenTUI is not shown: it is native Zig loaded over `bun:ffi`.

## Deploy

https://cssints.dev is a Cloudflare Worker serving `dist/` as static assets, described by `alchemy.run.ts` (Alchemy v2, stage `prod`). The deploy state is in the Cloudflare account (`Cloudflare.state()`), so a local deploy and a CI deploy see the same resources.

- **Local:** `bun alchemy profile edit --add Cloudflare` once (OAuth in the browser; if it says "already connected", `bun alchemy profile refresh --profile default --provider Cloudflare`), then `bun run deploy`.
- **CI:** `.github/workflows/docs.yml` deploys on every push to master that touches the docs, the packages or `bun.lock`, and on a manual run.

### GitHub secrets for CI

1. **Create an API token.** Cloudflare dashboard → My Profile → API Tokens → Create Token → Custom token, with:
   - Account → **Workers Scripts: Edit**
   - Account → **Secrets Store: Edit** (Alchemy reads its state-store token through a Secrets Store binding; `Read` is not enough)
   - Account → **Account Settings: Read**
   - Zone → **Workers Routes: Edit**, **DNS: Edit**, **Zone: Read**, for the zone `cssints.dev`
   - Account resources: the account `5968a0616879ef75c3c6759d0e2db561`.
2. **Add the secrets.** GitHub → the repository → Settings → Secrets and variables → Actions → New repository secret:
   - `CLOUDFLARE_API_TOKEN`: the token from step 1
   - `CLOUDFLARE_ACCOUNT_ID`: `5968a0616879ef75c3c6759d0e2db561`

   Or with the GitHub CLI: `gh secret set CLOUDFLARE_API_TOKEN` (paste the token) and `gh secret set CLOUDFLARE_ACCOUNT_ID --body 5968a0616879ef75c3c6759d0e2db561`.

3. **Check it.** GitHub → Actions → docs → Run workflow. The run ends with `{ url: 'https://cssints.dev' }`. A 403 from Cloudflare names the missing permission.
