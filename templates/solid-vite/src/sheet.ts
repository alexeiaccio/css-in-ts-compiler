// The engine's sheet for a browser test: its content is the CSS of the modules transformed so far, so it is loaded once the
// test file's imports are in (in `beforeAll`, not as a static import: vitest resolves the graph as it goes, and a sheet loaded
// first is just the `@layer` statement). A component's conformance test clicks its parts, so the sheet has to be there.
import { beforeAll } from "vite-plus/test";

beforeAll(async () => {
  await import("virtual:cssints.css");
});
