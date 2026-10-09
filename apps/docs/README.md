# cssints docs

The documentation site: pages from `README.md` and `docs/API.md`, built with Solid 2 and cssints. Commands are in `AGENTS.md`.

## Playground

`/playground` runs the engine in the browser: an editor, the CSS, the module as the plugin returns it, a live preview, errors at their position, the code in the URL hash. It is a lazy chunk and a worker (`src/playground/`); `plugin/playground.ts` makes what the engine imports from Node (SHA-1, `path`, `createRequire`, `browserslist`, the browser-compat data) and routes the parsers to their wasm builds. How and why: `docs/research/playground.md`. `node test/playground.mjs` compares it with the Node plugin.

## Deploy

https://cssints.accio.blue is a Cloudflare Worker serving `dist/` as static assets, described by `alchemy.run.ts` (Alchemy v2, stage `prod`). The deploy state is in the Cloudflare account (`Cloudflare.state()`), so a local deploy and a CI deploy see the same resources.

- **Local:** `bun alchemy profile edit --add Cloudflare` once (OAuth in the browser; if it says "already connected", `bun alchemy profile refresh --profile default --provider Cloudflare`), then `bun run deploy`.
- **CI:** `.github/workflows/docs.yml` deploys on every push to master that touches the docs, the packages or `bun.lock`, and on a manual run.

### GitHub secrets for CI

1. **Create an API token.** Cloudflare dashboard → My Profile → API Tokens → Create Token → Custom token, with:
   - Account → **Workers Scripts: Edit**
   - Account → **Secrets Store: Edit** (Alchemy reads its state-store token through a Secrets Store binding; `Read` is not enough)
   - Account → **Account Settings: Read**
   - Zone → **Workers Routes: Edit**, **DNS: Edit**, **Zone: Read**, limited to the zone `accio.blue` (the custom domain)
   - Account resources: the account `5968a0616879ef75c3c6759d0e2db561`.
2. **Add the secrets.** GitHub → the repository → Settings → Secrets and variables → Actions → New repository secret:
   - `CLOUDFLARE_API_TOKEN`: the token from step 1
   - `CLOUDFLARE_ACCOUNT_ID`: `5968a0616879ef75c3c6759d0e2db561`

   Or with the GitHub CLI: `gh secret set CLOUDFLARE_API_TOKEN` (paste the token) and `gh secret set CLOUDFLARE_ACCOUNT_ID --body 5968a0616879ef75c3c6759d0e2db561`.

3. **Check it.** GitHub → Actions → docs → Run workflow. The run ends with `{ url: 'https://cssints.accio.blue' }`. A 403 from Cloudflare names the missing permission.
