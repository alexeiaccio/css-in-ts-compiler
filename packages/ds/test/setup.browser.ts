import { beforeAll } from "vite-plus/test";

beforeAll(async () => {
  await import("virtual:cssints.css");
});
