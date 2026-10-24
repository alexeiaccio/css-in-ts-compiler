# cssints docs

The documentation site: pages from `README.md` and `docs/API.md`, built with Solid 2 and cssints. Commands are in `AGENTS.md`.

## Playground

`/playground` runs the engine in the browser: Monaco with the TypeScript worker and the types of cssints (hover, completion, type errors of the open file), several files that import each other (`import { t } from "./tokens.ts" with { type: "cssints" }`), the plugin packages that run without Node (`@cssints/fluid`, `layout`, `motion`, `tokens/*`, ...; not `fonts`, `icons`, `placeholder`, which read files), the CSS, the module as the plugin returns it, a live preview, errors at their position, all the files in the URL hash. It is a lazy chunk and three workers (`src/playground/`); `plugin/playground.ts` makes what the engine imports from Node (SHA-1, `path`, `createRequire`, `browserslist`, the browser-compat data), routes the parsers to their wasm builds, and collects the types and the sources of the packages. How and why: `docs/research/playground.md`. It opens a slice of csssky (`examples/csssky`: tokens and themes, the shell, a feed of post cards, posts from csssky's recorded fixtures) and has a picker of the example projects of `examples/`: one directory per docs page (its slug, the entry `index.ts(x)`), which the page links to with "Open in playground" (`#example=<slug>`; a page with nothing a browser could run has none: the list is in `test/playground.mjs`). Every example's entry calls `reset()` (`@cssints/reset`), so the code says what the preview and the Result show; a project without the call has no reset. The page of each example shows its Result under the link, made at build time (`plugin/examples.ts`: the Node plugin on one private server in a worker, the default export rendered to a string by `plugin/h.ts`, which shares `src/playground/hyper.ts` with the preview's `h`): a sandboxed `srcdoc` iframe with the project's sheet, readable without JS, that gets the display mode (`light`, `dim`, `dark`) as the class of its `<html>` and the site's canvas (background, text colour, font: custom properties that a rule of the lowest layer reads, in every palette) from the page's chunk; the playground's preview takes the same (`canvas` of `src/playground/hyper.ts`). The panel has two tabs, Result and Code (radio inputs, no script): Code is each file of the project highlighted at build time with Shiki, a switcher when there are several. `node test/frames.mjs` renders every example frame in light and dark, in two palettes, and asserts that no text has a contrast below 3:1 against its background. `node test/playground.mjs` compares the engine with the Node plugin (every example included) and drives the page in Chrome.

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

## Pages from the PDS

`DOCS_SOURCE=pds` builds the pages of `README.md` and `docs/API.md` (38 at the time of writing) from CMS documents in the cssints PDS instead of from the files; the default, `repo`, is the files. The packages' READMEs and the changelog are read from the repository either way. The PDS side is in effects-of-atmosphere (`docs/plans/cssints-docs-on-pds.md`).

- **What is read.** `com.atproto.repo.listRecords` on `https://pds.cssints.dev` (`DOCS_PDS_URL`), account `did:plc:4kvsgtskbbigk57wth4vcoiy` (`DOCS_PDS_DID`), collection `ing.lexicon.cms.document`, public, no login. A document is a page when its `type` is `doc`, its `lang` is `en` and its `publication` is `at://<did>/site.standard.publication/cssints-docs`. Its `uid` is the page's URL, `data.file` the file it came from (the relative links of the page are relative to it), `data.order` where it stands among the pages of that file, and `body` holds the page as Portable Text in one `richText` section. `plugin/portable-text.ts` writes it back as markdown, and `plugin/markdown.ts` builds it as it builds a file's section: the headings, ids, links and code blocks are the same code. The page's title, group and the "(decided …)" tag are read from its heading and its file, as for a file; `data.title` and `data.group` are there for the CMS admin's list.
- **When the PDS cannot be read the build fails.** It tries each read three times (1 s, 2 s apart; not for a 4xx), then stops with the URL and the status. It does not fall back to the files: with the PDS as the source they go stale, and a green deploy of old pages over new ones is worse than no deploy, since a failed build leaves the site as it was. It also stops on an empty account, a file with no pages, a page that cannot be read, two pages with one slug, and a first page that is not `overview`. Going back to the files is `DOCS_SOURCE=repo`.
- **Checking it.** `node test/pds.mjs` (in `bun run test`) runs the reader against a PDS served from the test: paging, retries, every failure above, and the Portable Text of a page with every construct the docs use against the importer's own output (`test/fixtures/pds/`). `DOCS_PDS_DUMP=<file> node test/pds.mjs` also builds the real pages both ways and asserts they are the same; the file is the records the importer writes with `--out` (`pnpm --filter @eoa/cms-import cssints --root <this checkout> --dry-run --out <file>` in effects-of-atmosphere).
- **In CI** the deploy takes `DOCS_SOURCE` from the repository variable of that name (Settings → Secrets and variables → Actions → Variables), so the switch and the way back are not commits. `workflow_dispatch` takes a `nudge` input, which is what the site-hook relay of effects-of-atmosphere sends when a page changes; `alchemy.run.ts` builds with `memo: false`, because Alchemy cannot hash the PDS and would otherwise skip a build whose files did not change.
