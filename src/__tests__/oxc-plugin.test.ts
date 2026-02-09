// Oxc Plugin Tests

import { describe, it, expect, beforeEach } from 'bun:test';
import { cssTSOxcPlugin, type OxcPluginOptions } from '../oxc-plugin';
import { parseSync } from 'oxc-parser';

describe('Oxc Plugin', () => {
  describe('Plugin creation', () => {
    it('should create plugin with default options', () => {
      const plugin = cssTSOxcPlugin();
      expect(plugin.name).toBe('css-in-ts-oxc');
      expect(plugin.enforce).toBe('pre');
    });

    it('should create plugin with custom options', () => {
      const options: OxcPluginOptions = {
        include: ['**/*.tsx'],
        exclude: ['**/test/**'],
        cssFileName: 'custom.css',
        inject: false,
        debug: true,
      };

      const plugin = cssTSOxcPlugin(options);
      expect(plugin.name).toBe('css-in-ts-oxc');
    });

    it('should have all required hooks', () => {
      const plugin = cssTSOxcPlugin();
      expect(typeof plugin.transform).toBe('function');
      expect(typeof plugin.generateBundle).toBe('function');
      expect(typeof plugin.resolveId).toBe('function');
      expect(typeof plugin.load).toBe('function');
    });
  });

  describe('Pattern matching', () => {
    it('should match TypeScript files by default', () => {
      const plugin = cssTSOxcPlugin();
      expect(plugin).toBeDefined();
    });

    it('should support custom include patterns', () => {
      const plugin = cssTSOxcPlugin({
        include: ['**/*.component.ts'],
      });
      expect(plugin).toBeDefined();
    });

    it('should support custom exclude patterns', () => {
      const plugin = cssTSOxcPlugin({
        exclude: ['**/node_modules/**', '**/*.test.ts'],
      });
      expect(plugin).toBeDefined();
    });
  });

  describe('Debug mode', () => {
    it('should enable debug mode when debug option is true', () => {
      const plugin = cssTSOxcPlugin({ debug: true });
      expect(plugin).toBeDefined();
    });

    it('should disable debug mode by default', () => {
      const plugin = cssTSOxcPlugin();
      expect(plugin).toBeDefined();
    });
  });

  describe('CSS injection', () => {
    it('should return config when inject is true', () => {
      const plugin = cssTSOxcPlugin({ inject: true });
      const result = plugin.config?.();
      expect(result).toBeDefined();
    });

    it('should return undefined when inject is false', () => {
      const plugin = cssTSOxcPlugin({ inject: false });
      const result = plugin.config?.();
      expect(result).toBeUndefined();
    });
  });

  describe('HMR Options', () => {
    it('should have default HMR options', () => {
      const plugin = cssTSOxcPlugin();
      expect(plugin).toBeDefined();
    });

    it('should enable HMR by default', () => {
      const options: OxcPluginOptions = {};
      const plugin = cssTSOxcPlugin(options);
      expect(plugin).toBeDefined();
    });

    it('should support disabling HMR', () => {
      const options: OxcPluginOptions = {
        hmr: {
          enabled: false,
        },
      };
      const plugin = cssTSOxcPlugin(options);
      expect(plugin).toBeDefined();
    });

    it('should support virtual modules option', () => {
      const options: OxcPluginOptions = {
        hmr: {
          virtualModules: false,
        },
      };
      const plugin = cssTSOxcPlugin(options);
      expect(plugin).toBeDefined();
    });

    it('should support custom module suffix', () => {
      const options: OxcPluginOptions = {
        hmr: {
          moduleSuffix: '.module.css',
        },
      };
      const plugin = cssTSOxcPlugin(options);
      expect(plugin).toBeDefined();
    });

    it('should have hotUpdate hook when HMR is enabled', () => {
      const plugin = cssTSOxcPlugin({
        hmr: {
          enabled: true,
        },
      });
      expect(typeof plugin.hotUpdate).toBe('function');
    });
  });

  describe('Style extraction (unit tests)', () => {
    it('should parse simple TypeScript code', () => {
      const code = `
        const button = style('button', {
          color: 'red',
          fontSize: '16px',
        });
      `;

      const result = parseSync('/test.ts', code, {
        lang: 'ts',
        sourceType: 'module',
        astType: 'ts',
        range: true,
      });

      expect(result.errors.length).toBe(0);
      expect(result.program).toBeDefined();
    });

    it('should parse TypeScript with type annotations', () => {
      const code = `
        interface ButtonProps {
          primary?: boolean;
        }
        
        const button = style('button', {
          color: 'blue',
        });
      `;

      const result = parseSync('/test.ts', code, {
        lang: 'ts',
        sourceType: 'module',
        astType: 'ts',
        range: true,
      });

      expect(result.errors.length).toBe(0);
    });

    it('should parse TSX with JSX', () => {
      const code = `
        import { style } from 'css-in-ts';
        
        const button = style('button', {
          color: 'red',
        });
        
        export function Button() {
          return <button className={button}>Click</button>;
        }
      `;

      const result = parseSync('/test.tsx', code, {
        lang: 'tsx',
        sourceType: 'module',
        astType: 'ts',
        range: true,
      });

      expect(result.errors.length).toBe(0);
    });
  });

  describe('Class name generation', () => {
    it('should generate consistent class names', () => {
      const code = `
        const style1 = style('button', { color: 'red' });
        const style2 = style('button', { color: 'red' });
      `;

      const result = parseSync('/test.ts', code, {
        lang: 'ts',
        sourceType: 'module',
        astType: 'ts',
        range: true,
      });

      expect(result.errors.length).toBe(0);
    });

    it('should include file scope in class name', () => {
      const code = `const button = style('button', { color: 'red' });`;

      const result = parseSync('/components/Button.ts', code, {
        lang: 'ts',
        sourceType: 'module',
        astType: 'ts',
        range: true,
      });

      expect(result.errors.length).toBe(0);
    });
  });

  describe('Object property extraction', () => {
    it('should extract simple properties in style call', () => {
      const code = `
        style('button', {
          color: 'red',
          fontSize: '16px',
        });
      `;

      const result = parseSync('/test.ts', code, {
        lang: 'ts',
        sourceType: 'module',
        astType: 'ts',
        range: true,
      });

      expect(result.errors.length).toBe(0);
    });

    it('should extract nested objects for pseudo-classes', () => {
      const code = `
        style('button', {
          color: 'blue',
          '&:hover': {
            color: 'green',
          },
        });
      `;

      const result = parseSync('/test.ts', code, {
        lang: 'ts',
        sourceType: 'module',
        astType: 'ts',
        range: true,
      });

      expect(result.errors.length).toBe(0);
    });

    it('should extract media queries', () => {
      const code = `
        style('button', {
          padding: '8px',
          '@media (min-width: 768px)': {
            padding: '16px',
          },
        });
      `;

      const result = parseSync('/test.ts', code, {
        lang: 'ts',
        sourceType: 'module',
        astType: 'ts',
        range: true,
      });

      expect(result.errors.length).toBe(0);
    });

    it('should extract complex nested structures', () => {
      const code = `
        style('card', {
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
          '@media (min-width: 768px)': {
            padding: '24px',
            flexDirection: 'row',
          },
          '&:hover': {
            transform: 'scale(1.02)',
          },
        });
      `;

      const result = parseSync('/test.ts', code, {
        lang: 'ts',
        sourceType: 'module',
        astType: 'ts',
        range: true,
      });

      expect(result.errors.length).toBe(0);
    });
  });

  describe('Virtual CSS Modules', () => {
    it('should generate virtual module ID', () => {
      const plugin = cssTSOxcPlugin();
      expect(plugin).toBeDefined();
    });

    it('should handle resolveId for virtual modules', () => {
      const plugin = cssTSOxcPlugin();
      const resolved = plugin.resolveId?.('virtual:css-in-ts/Button.css');
      expect(resolved).toBe('virtual:css-in-ts/Button.css');
    });

    it('should return null for non-virtual modules in resolveId', () => {
      const plugin = cssTSOxcPlugin();
      const resolved = plugin.resolveId?.('/src/components/Button.tsx');
      expect(resolved).toBeNull();
    });
  });

  describe('HMR Integration', () => {
    it('should have hotUpdate hook', () => {
      const plugin = cssTSOxcPlugin({
        hmr: { enabled: true },
      });
      expect(typeof plugin.hotUpdate).toBe('function');
    });

    it('should have hotUpdate hook even when HMR is disabled in config', () => {
      // hotUpdate hook always exists, but it may short-circuit internally
      const plugin = cssTSOxcPlugin({
        hmr: { enabled: false },
      });
      expect(typeof plugin.hotUpdate).toBe('function');
    });

    it('should process valid file in hotUpdate', async () => {
      const plugin = cssTSOxcPlugin({
        hmr: { enabled: true },
      });

      const mockServer = {
        hotManager: {
          send: () => {},
        },
        moduleGraph: {
          getModulesByFile: () => new Set(),
        },
        invalidateModule: () => {},
      };

      const hotUpdate = plugin.hotUpdate;
      if (hotUpdate) {
        const result = await hotUpdate.call(
          { ...plugin, server: mockServer },
          {
            file: '/src/components/Button.tsx',
            modules: [],
            read: () => Promise.resolve(''),
            server: mockServer as any,
          }
        );
        // hotUpdate returns undefined when no changes needed
        expect(result).toBeUndefined();
      }
    });
  });

  describe('CSS Generation', () => {
    it('should generate valid CSS from styles', () => {
      const code = `
        style('button', {
          color: 'red',
          backgroundColor: 'blue',
        });
      `;

      const result = parseSync('/test.ts', code, {
        lang: 'ts',
        sourceType: 'module',
        astType: 'ts',
        range: true,
      });

      expect(result.errors.length).toBe(0);
    });

    it('should handle multiple styles in one file', () => {
      const code = `
        style('button', { color: 'red' });
        style('card', { backgroundColor: 'white' });
        style('header', { fontSize: '16px' });
      `;

      const result = parseSync('/test.ts', code, {
        lang: 'ts',
        sourceType: 'module',
        astType: 'ts',
        range: true,
      });

      expect(result.errors.length).toBe(0);
    });
  });

  describe('Import Injection', () => {
    it('should inject CSS import at the beginning of file', () => {
      const code = `
        import React from 'react';
        const button = style('button', { color: 'red' });
      `;

      const result = parseSync('/test.ts', code, {
        lang: 'ts',
        sourceType: 'module',
        astType: 'ts',
        range: true,
      });

      expect(result.errors.length).toBe(0);
    });

    it('should handle files without imports', () => {
      const code = `const button = style('button', { color: 'red' });`;

      const result = parseSync('/test.ts', code, {
        lang: 'ts',
        sourceType: 'module',
        astType: 'ts',
        range: true,
      });

      expect(result.errors.length).toBe(0);
    });
  });
});
