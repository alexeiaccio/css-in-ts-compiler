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
      // the build reads the PDS (DOCS_SOURCE=pds, plugin/pds.ts), which Alchemy cannot hash: with the default it skips a build
      // whose files did not change, and a deploy that a CMS edit started would ship the last build again
      memo: false,
      assets: { notFoundHandling: "404-page" },
      domain: "cssints.dev",
    });
    return { url: site.url };
  }),
);
