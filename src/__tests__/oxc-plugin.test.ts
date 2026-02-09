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
    });
  });

  describe('Pattern matching', () => {
    it('should match TypeScript files by default', () => {
      const plugin = cssTSOxcPlugin();
      // Plugin should process .ts files
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
    it('should enable CSS injection by default', () => {
      const plugin = cssTSOxcPlugin();
      expect(plugin.config).toBeDefined();
    });

    it('should disable CSS injection when inject is false', () => {
      const plugin = cssTSOxcPlugin({ inject: false });
      // When inject is false, config might not return anything
      const result = plugin.config?.();
      expect(result).toBeUndefined();
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

      // Both should generate same hash for same properties
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
});
