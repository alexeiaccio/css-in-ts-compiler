import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts", "scripts/**/*.test.ts"],
    // The diff-check integration tests spawn git, node and oxlint (a temp repository each); the default 5 s is under
    // their cold start on a busy machine (the CLI alone is ~4.5 s on the whole repository).
    testTimeout: 30_000,
  },
});
