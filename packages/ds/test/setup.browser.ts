import { beforeAll } from "vite-plus/test";

beforeAll(async () => {
  await import(`/@cssints/sheet.css?file=${Math.random().toString(36).slice(2)}`);
});
