/**
 * Main unplugin implementation for cssints
 *
 * Provides macro transformation and CSS generation
 * Note: Currently Vite-specific implementation is in vite.ts
 */

import type { UnpluginFactory, UnpluginOptions } from "unplugin";
import type { CssintsOptions } from "./types.js";

const PLUGIN_NAME = "cssints";
const VIRTUAL_CSS_ID = "virtual:cssints.css";

/**
 * Factory function for creating the unplugin
 */
export const createUnplugin: UnpluginFactory<CssintsOptions | undefined> = (
  options = {}
) => {
  const resolvedOptions = {
    css: {
      minify: true,
      output: "styles.css",
      targets: undefined as import("lightningcss").Targets | undefined,
      ...options.css,
    },
    naming: {
      devPrefix: true,
      hashLength: 7,
      ...options.naming,
    },
  };

  // Store for CSS generated during build
  const cssStore = new Map<string, string>();

  return {
    name: PLUGIN_NAME,
    enforce: "pre",

    // Vite-specific configuration
    vite: {
      // Configure the plugin for Vite
      config() {
        return {
          optimizeDeps: {
            exclude: ["cssints"],
          },
        };
      },

      // Resolve virtual CSS modules
      resolveId(id: string) {
        if (id === VIRTUAL_CSS_ID || id.startsWith("virtual:cssints:")) {
          return "\0" + id;
        }
        return null;
      },

      // Load virtual CSS content
      load(id: string) {
        if (id.startsWith("\0virtual:cssints:")) {
          const sourceId = id.slice("\0virtual:cssints:".length);
          const css = cssStore.get(sourceId);
          if (css) {
            return css;
          }
        }
        return null;
      },

      // Transform code with macros
      async transform(code: string, id: string) {
        // Only process TypeScript/JavaScript files
        if (!/\.(ts|tsx|js|jsx)$/.test(id)) {
          return null;
        }

        // Skip node_modules
        if (id.includes("node_modules")) {
          return null;
        }

        // Check if file contains cssints macro import with { type: "macro" }
        const hasMacroImport =
          code.includes('from "cssints" with { type: "macro" }') ||
          code.includes("from 'cssints' with { type: 'macro' }");

        if (!hasMacroImport) {
          return null;
        }

        // TODO: Implement actual transformation
        // For now, just inject CSS import
        const virtualImport = `import "${VIRTUAL_CSS_ID}:${id}";\n`;

        return {
          code: virtualImport + code,
          map: null,
        };
      },

      // Generate CSS bundle in production
      generateBundle(this: import("rollup").PluginContext) {
        // Combine all CSS
        const allCss = Array.from(cssStore.values()).join("\n\n");

        if (allCss) {
          this.emitFile({
            type: "asset",
            fileName: resolvedOptions.css.output,
            source: allCss,
          });
        }
      },
    },

    // Rollup/Webpack/Esbuild configurations can be added here
    // rollup: { ... },
    // webpack: { ... },
    // esbuild: { ... },
  } as UnpluginOptions;
};

/**
 * Export types
 */
export type { CssintsOptions };
