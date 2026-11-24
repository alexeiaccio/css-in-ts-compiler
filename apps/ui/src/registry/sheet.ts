// The engine's sheet for a browser test. The bare `virtual:cssints.css` is cached per page, so a run would paint the first
// file's sheet in every later file; `virtual:cssints/sheet.css` takes a query, which is a fresh module and a fresh sheet.
import { beforeAll } from "vite-plus/test";

beforeAll(async () => {
  await import(`/@cssints/sheet.css?file=${Math.random().toString(36).slice(2)}`);
});
