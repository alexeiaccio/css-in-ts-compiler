// The documentation site on Cloudflare: `bun run build` in this directory, dist/ served as Worker static assets.
// bun run deploy (alchemy deploy); credentials from `bun alchemy profile edit --add Cloudflare`, state in .alchemy/.
import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";

export default Alchemy.Stack(
  "CssintsDocs",
  { providers: Cloudflare.providers(), state: Alchemy.localState() },
  Effect.gen(function* () {
    const site = yield* Cloudflare.Website.StaticSite("Docs", {
      command: "bun run build",
      outdir: "dist",
      assets: { notFoundHandling: "404-page" },
    });
    return { url: site.url };
  }),
);
