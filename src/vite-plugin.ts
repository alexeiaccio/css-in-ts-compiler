/**
 * Vite Plugin for css-in-ts (Regex-based implementation)
 * 
 * @deprecated Use cssTSOxcPlugin (oxc-based AST implementation) for better reliability
 * @deprecated This plugin will be removed in a future version
 */

import { Plugin } from 'vite';
import * as esbuild from 'esbuild';
import { setFileScope, generateCSS, clearRegistry } from './compiler.js';

// Plugin options
export interface CSSTSPluginOptions {
  include?: string[];
  exclude?: string[];
  cssFileName?: string;
  inject?: boolean;
}

// Default options
const defaultOptions: Required<CSSTSPluginOptions> = {
  include: ['**/*.{ts,tsx,js,jsx}'],
  exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  cssFileName: 'styles.css',
  inject: true,
};

// Create the Vite plugin
/**
 * @deprecated Use cssTSOxcPlugin instead
 */
export function cssTSPlugin(options: CSSTSPluginOptions = {}): Plugin {
  const opts = { ...defaultOptions, ...options };
  const styleMap = new Map<string, string>();

  return {
    name: 'css-in-ts (deprecated)',
    enforce: 'pre',
    /**
     * @deprecated Use cssTSOxcPlugin instead - it uses proper AST parsing
     */
    deprecated: 'Use cssTSOxcPlugin for better AST-based style extraction',

    configResolved(config) {
      // Inject CSS injection script if enabled
      if (opts.inject && config.build?.cssCodeSplit !== false) {
        config.plugins?.push({
          name: 'css-in-ts-injector',
          apply: 'build',
          generateBundle() {
            // CSS will be generated in the transform hook
          },
        });
      }
    },

    async transform(code, id) {
      // Check if file should be processed
      const shouldProcess = opts.include.some(pattern =>
        id.match(new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')))
      ) && !opts.exclude.some(pattern =>
        id.match(new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')))
      );

      if (!shouldProcess) {
        return null;
      }

      // Set file scope for this file
      setFileScope(id);

      try {
        // Transform the code with esbuild
        const result = await esbuild.transform(code, {
          loader: 'ts',
          target: 'es2020',
          format: 'esm',
        });

        // Extract style definitions and replace with class names
        const transformedCode = extractAndReplaceStyles(result.code, id);

        return {
          code: transformedCode,
          map: result.map,
        };
      } catch (error) {
        console.error(`Error transforming ${id}:`, error);
        return null;
      }
    },

    generateBundle() {
      // Generate CSS from all registered styles
      const css = generateCSS();

      if (css) {
        // Add CSS to bundle
        bundle[opts.cssFileName] = {
          type: 'asset',
          fileName: opts.cssFileName,
          source: css,
        };
      }

      // Clear registry for next build
      clearRegistry();
    },
  };
}

// Extract style definitions and replace with class names
function extractAndReplaceStyles(code: string, fileId: string): string {
  // This is a simplified version - a full implementation would use AST parsing
  // For now, we'll do regex-based extraction as a proof of concept

  // Match style() calls: style('name', { ... })
  const styleRegex = /style\s*\(\s*['"]([^'"]+)['"]\s*,\s*(\{[^}]+\})\s*\)/g;

  return code.replace(styleRegex, (match, name, propsStr) => {
    // Generate a hash-based class name
    const hash = generateHash(propsStr);
    const className = `${fileId.split('/').pop()?.replace(/\.(ts|tsx)$/, '')}_${name}__${hash}`;

    // Store the mapping for CSS generation
    styleMap.set(`${fileId}:${name}`, className);

    // Return the class name
    return `"${className}"`;
  });
}

// Simple hash function for class names
function generateHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}
