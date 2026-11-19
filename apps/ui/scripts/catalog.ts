// Writes `public/catalog.json`: every starter the site draws, its stories, the args each uses and the args each takes — the
// same JSON `#catalog` shows, served as a file so an agent can fetch it instead of reading a page that needs JavaScript.
//
//   node scripts/catalog.ts
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { createServer } from "vite";

const root = join(import.meta.dirname, "..");
const server = await createServer({ root, logLevel: "warn", server: { middlewareMode: true } });
try {
  const catalog = await server.ssrLoadModule("/src/docs/catalog.ts");
  const site = await server.ssrLoadModule("/src/stories/site.ts");
  const surface = await server.ssrLoadModule("/src/docs/surface.ts");
  const items = surface.catalogOf(catalog.items, site.stories);
  writeFileSync(
    join(root, "public/catalog.json"),
    `${JSON.stringify({ version: 1, items }, null, 2)}\n`,
  );
  console.log(`${items.length} starters in ${join(root, "public/catalog.json")}`);
} finally {
  await server.close();
}
