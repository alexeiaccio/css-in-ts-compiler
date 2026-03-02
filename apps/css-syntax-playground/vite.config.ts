import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: ".",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 3457,
  },
  resolve: {
    alias: [
      {
        find: "@cssints/css-syntax/lexer",
        replacement: path.resolve(__dirname, "../../packages/css-syntax/src/lexer/index.ts"),
      },
      {
        find: "@cssints/css-syntax/parser",
        replacement: path.resolve(__dirname, "../../packages/css-syntax/src/parser/stylesheet-parser.ts"),
      },
    ],
  },
});
