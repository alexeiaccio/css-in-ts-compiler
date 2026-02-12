// Compiler tests

import { describe, it, expect, beforeEach } from 'bun:test';
import { style, cx, generateCSS, setFileScope, clearRegistry, getRegisteredClasses } from '../compiler';

describe('Compiler', () => {
  beforeEach(() => {
    clearRegistry();
    setFileScope('/test/file.ts');
  });

  describe('style()', () => {
    it('should generate hash-based class names', () => {
      const className = style('test', { color: 'red' });
      expect(className).toMatch(/test__\w+/);
    });

    it('should generate consistent class names for same properties', () => {
      const className1 = style('test', { color: 'red' });
      const className2 = style('test', { color: 'red' });
      expect(className1).toBe(className2);
    });

    it('should generate different class names for different properties', () => {
      const className1 = style('test', { color: 'red' });
      const className2 = style('test', { color: 'blue' });
      expect(className1).not.toBe(className2);
    });

    it('should handle nested properties (media queries)', () => {
      const className = style('test', {
        color: 'red',
        '@media (min-width: 768px)': {
          color: 'blue',
        },
      });
      expect(className).toBeTruthy();
    });

    it('should handle pseudo-classes', () => {
      const className = style('test', {
        color: 'red',
        '&:hover': {
          color: 'blue',
        },
      });
      expect(className).toBeTruthy();
    });

    it('should handle pseudo-elements', () => {
      const className = style('test', {
        '&::before': {
          content: '""',
        },
      });
      expect(className).toBeTruthy();
    });
  });

  describe('cx()', () => {
    it('should compose multiple style objects', () => {
      const className = cx(
        { color: 'red' },
        { fontSize: '16px' },
        { padding: '10px' }
      );
      expect(className).toBeTruthy();
      expect(typeof className).toBe('string');
    });

    it('should handle string class names', () => {
      const className = cx('existing-class', { color: 'red' });
      expect(className).toContain('existing-class');
    });

    it('should merge nested properties', () => {
      const className = cx(
        { color: 'red', '&:hover': { color: 'blue' } },
        { fontSize: '16px' }
      );
      expect(className).toBeTruthy();
    });
  });

  describe('generateCSS()', () => {
    it('should generate CSS from registered classes', () => {
      style('test', { color: 'red' });
      const css = generateCSS();
      expect(css).toContain('.file_test__');
      expect(css).toContain('color: red;');
    });

    it('should generate component classes', () => {
      style('test', { color: 'red', fontSize: '16px' });
      const css = generateCSS();
      expect(css).toContain('.file_test__');
      expect(css).toContain('color: red;');
      expect(css).toContain('fontSize: 16px;');
    });

    it('should generate media queries', () => {
      style('test', {
        '@media (min-width: 768px)': {
          color: 'blue',
        },
      });
      const css = generateCSS();
      expect(css).toContain('@media (min-width: 768px)');
    });

    it('should generate pseudo-classes', () => {
      style('test', {
        '&:hover': {
          color: 'blue',
        },
      });
      const css = generateCSS();
      expect(css).toContain(':hover');
    });

    it('should generate pseudo-elements', () => {
      style('test', {
        '&::before': {
          content: '""',
        },
      });
      const css = generateCSS();
      expect(css).toContain('::before');
    });
  });

  describe('Registry', () => {
    it('should track registered classes', () => {
      style('test', { color: 'red' });
      const classes = getRegisteredClasses();
      expect(classes.size).toBeGreaterThan(0);
    });

    it('should clear registry', () => {
      style('test', { color: 'red' });
      clearRegistry();
      const classes = getRegisteredClasses();
      expect(classes.size).toBe(0);
    });

    it('should deduplicate classes with same properties', () => {
      const className1 = style('test1', { color: 'red' });
      const className2 = style('test2', { color: 'red' });

      // Same properties should generate same hash
      const hash1 = className1.split('__')[1];
      const hash2 = className2.split('__')[1];
      expect(hash1).toBe(hash2);
    });
  });

  describe('File scope', () => {
    it('should track file scope', () => {
      setFileScope('/test/file1.ts');
      const className1 = style('test', { color: 'red' });

      setFileScope('/test/file2.ts');
      const className2 = style('test', { color: 'red' });

      // Different file scopes should generate different class names
      expect(className1).not.toBe(className2);
    });
  });
});
