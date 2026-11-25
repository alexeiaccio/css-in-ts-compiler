import solid from "@solidjs/vite-plugin";
import cssints from "cssints/vite";
import { defineConfig } from "vite-plus";

export default defineConfig({
  root: "dev",
  plugins: [cssints(), solid()],
});
