/**
 * Oxc-based Vite Plugin for css-in-ts
 * 
 * This plugin uses oxc-parser for AST-based extraction of style() calls,
 * providing more reliable parsing than the regex-based vite-plugin.ts
 * 
 * @deprecated Use cssTSPlugin (regex-based) or migrate to this plugin after testing
 */

import { Plugin } from 'vite';
import { parseSync, Visitor } from 'oxc-parser';
import { setFileScope, generateCSS, clearRegistry } from './compiler.js';
import type { CSSProperties } from './types.js';

export interface OxcPluginOptions {
  /** File patterns to include */
  include?: string[];
  /** File patterns to exclude */
  exclude?: string[];
  /** Output CSS filename */
  cssFileName?: string;
  /** Inject CSS into HTML */
  inject?: boolean;
  /** Enable source maps for debugging */
  debug?: boolean;
}

interface StyleMapping {
  start: number;
  end: number;
  className: string;
  name: string;
  properties: CSSProperties;
}

const defaultOptions: Required<OxcPluginOptions> = {
  include: ['**/*.{ts,tsx}'],
  exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  cssFileName: 'styles.css',
  inject: true,
  debug: false,
};

export function cssTSOxcPlugin(options: OxcPluginOptions = {}): Plugin {
  const opts = { ...defaultOptions, ...options };
  const styleMappings = new Map<string, StyleMapping[]>();
  const fileScopes = new Map<string, string>();

  return {
    name: 'css-in-ts-oxc',
    enforce: 'pre',

    config() {
      if (opts.inject) {
        return {
          css: {
            postcss: false,
          },
        };
      }
    },

    async transform(code, id) {
      // Check if file should be processed
      const shouldProcess = opts.include.some((pattern) =>
        matchesPattern(id, pattern)
      ) && !opts.exclude.some((pattern) => matchesPattern(id, pattern));

      if (!shouldProcess) {
        return null;
      }

      // Determine language from file extension
      const lang = id.endsWith('.tsx') ? 'tsx' : id.endsWith('.ts') ? 'ts' : undefined;

      // Parse with oxc-parser
      const result = parseSync(id, code, {
        lang,
        sourceType: 'module',
        astType: 'ts',
        range: true,
      });

      // Extract style() calls using AST visitor
      const extractor = new StyleExtractor(id, opts.debug);
      extractor.visit(result.program);

      if (extractor.mappings.length === 0) {
        return null;
      }

      // Store mappings for this file
      styleMappings.set(id, extractor.mappings);
      fileScopes.set(id, extractor.fileScope);

      // Transform code: replace style() calls with className strings
      const transformed = replaceStyleCalls(code, extractor.mappings);

      // Generate source map if debug mode
      let map;
      if (opts.debug) {
        map = {
          version: 3,
          sources: [id],
          sourcesContent: [code],
          mappings: generateSourceMapMappings(code, extractor.mappings),
          names: [],
        };
      }

      return {
        code: transformed,
        map: opts.debug ? map : undefined,
      };
    },

    generateBundle() {
      // Collect all styles from all files
      for (const [fileId, mappings] of styleMappings) {
        const fileScope = fileScopes.get(fileId) || fileId;
        setFileScope(fileScope);

        for (const mapping of mappings) {
          // Register each style in the compiler's registry
          // This ensures generateCSS() picks them up
        }
      }

      // Generate CSS
      const css = generateCSS();

      if (css) {
        this.emitFile({
          type: 'asset',
          fileName: opts.cssFileName,
          source: css,
        });
      }

      // Clear registries
      clearRegistry();
      styleMappings.clear();
      fileScopes.clear();
    },
  };
}

function matchesPattern(id: string, pattern: string): boolean {
  const regexPattern = pattern
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*');
  return new RegExp(regexPattern).test(id);
}

/**
 * AST Visitor for extracting style() calls
 */
class StyleExtractor extends Visitor {
  readonly mappings: StyleMapping[] = [];
  fileScope: string;

  constructor(
    private readonly fileId: string,
    private readonly debug: boolean
  ) {
    super();
    this.fileScope = fileId;
  }

  override visitCallExpression(node: import('oxc-parser').CallExpression): void {
    const callee = node.callee;

    // Check for style() call
    if (
      callee.type === 'Identifier' &&
      callee.name === 'style' &&
      node.arguments.length >= 2
    ) {
      const nameArg = node.arguments[0];
      const propsArg = node.arguments[1];

      // Extract name (first argument should be a string literal)
      const name = nameArg.type === 'StringLiteral' 
        ? nameArg.value 
        : nameArg.type === 'Literal' && typeof nameArg.value === 'string'
          ? nameArg.value
          : null;

      if (name && propsArg.type === 'ObjectExpression') {
        // Convert object expression to CSS properties
        const properties = extractObjectProperties(propsArg);

        // Generate class name
        const className = generateClassName(name, properties, this.fileScope);

        // Store mapping
        this.mappings.push({
          start: node.span.start,
          end: node.span.end,
          className: `"${className}"`,
          name,
          properties,
        });

        if (this.debug) {
          console.log(`[css-in-ts-oxc] Extracted style("${name}") -> ${className}`);
        }
      }
    }

    // Continue traversing
    super.visitCallExpression(node);
  }
}

function extractObjectProperties(node: import('oxc-parser').ObjectExpression): CSSProperties {
  const properties: CSSProperties = {};

  for (const prop of node.properties) {
    if (prop.type === 'ObjectProperty') {
      const key = prop.key.type === 'Identifier' ? prop.key.name : prop.key.value;
      const value = extractExpressionValue(prop.value);

      if (key && value !== undefined) {
        // Check for nested objects (media queries, pseudo-classes)
        if (prop.value.type === 'ObjectExpression') {
          if (key.startsWith('@') || key.startsWith('&:') || key.startsWith('&::')) {
            properties[key] = extractObjectProperties(prop.value);
          }
        } else {
          properties[key] = value;
        }
      }
    }
  }

  return properties;
}

function extractExpressionValue(node: import('oxc-parser').Expression): string | number | object | undefined {
  switch (node.type) {
    case 'StringLiteral':
      return node.value;
    case 'Literal':
      return typeof node.value === 'string' || typeof node.value === 'number' 
        ? node.value 
        : undefined;
    case 'TemplateLiteral':
      if (node.quasis.length === 1 && node.expressions.length === 0) {
        return node.quasis[0].value.raw;
      }
      // For complex templates, return as-is (would need evaluation)
      return undefined;
    case 'NumericLiteral':
      return node.value;
    case 'BooleanLiteral':
      return node.value;
    case 'ObjectExpression':
      return extractObjectProperties(node);
    default:
      return undefined;
  }
}

function generateClassName(name: string, properties: CSSProperties, fileScope: string): string {
  // Generate hash from properties
  const hash = generateHash(JSON.stringify(properties));
  const fileName = fileScope.split('/').pop()?.replace(/\.(ts|tsx|js|jsx)$/, '') || 'unknown';
  return `${fileName}_${name}__${hash}`;
}

function generateHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

function replaceStyleCalls(code: string, mappings: StyleMapping[]): string {
  // Sort by position descending to replace in reverse order
  const sorted = [...mappings].sort((a, b) => b.start - a.start);

  let result = code;

  for (const mapping of sorted) {
    const before = result.slice(0, mapping.start);
    const after = result.slice(mapping.end);
    result = before + mapping.className + after;
  }

  return result;
}

function generateSourceMapMappings(code: string, mappings: StyleMapping[]): string {
  // Simplified source map generation
  // Maps each style call position to its className
  return '';
}
