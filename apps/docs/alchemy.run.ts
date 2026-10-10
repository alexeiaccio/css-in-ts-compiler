// The documentation site on Cloudflare at cssints.dev: `bun run build` in this directory, dist/ served as Worker static assets.
// bun run deploy (alchemy deploy); credentials from `bun alchemy profile edit --add Cloudflare` (CI: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID); state in the account (Cloudflare.state()), shared by local and CI deploys.
import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";

export default Alchemy.Stack(
  "CssintsDocs",
  { providers: Cloudflare.providers(), state: Cloudflare.state() },
  Effect.gen(function* () {
    const site = yield* Cloudflare.Website.StaticSite("Docs", {
      command: "bun run build",
      outdir: "dist",
      assets: { notFoundHandling: "404-page" },
      // the old address answers with a 301 to the new one (a redirect rule in its zone, before the Worker)
      domain: { name: "cssints.dev", redirects: ["cssints.accio.blue"] },
    });
    return { url: site.url };
  }),
);
