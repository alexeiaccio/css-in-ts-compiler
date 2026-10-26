// The starters' site on Cloudflare at ui.cssints.dev: `bun run build` in this directory, dist/ served as Worker static
// assets. bun run deploy (alchemy deploy); credentials from `bun alchemy profile edit --add Cloudflare` (CI:
// CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID); state in the account (Cloudflare.state()), shared by local and CI deploys.
import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";

export default Alchemy.Stack(
  "CssintsUi",
  { providers: Cloudflare.providers(), state: Cloudflare.state() },
  Effect.gen(function* () {
    const site = yield* Cloudflare.Website.StaticSite("Ui", {
      command: "bun run build",
      outdir: "dist",
      domain: "ui.cssints.dev",
    });
    return { url: site.url };
  }),
);
