/**
 * Integration Test: End-to-End CSS-in-TS Workflow
 * 
 * Tests the complete flow:
 * 1. Macro functions generate placeholder CSS
 * 2. Post-processor transforms to actual CSS
 * 3. Result has proper hashed class names and layers
 */

import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { processCSS } from "../index.js";

describe("Integration: CSS-in-TS Workflow", () => {
  it("should transform @atomic rules into hashed CSS classes", async () => {
    const inputCSS = `
      @atomic padding 1rem { }
      @atomic margin 0.5rem { }
      @atomic display flex { }
    `;

    const result = await Effect.runPromise(processCSS(inputCSS));

    // Should generate hashed class names
    expect(result.code).toMatch(/\._[a-f0-9]{6}/);
    // Should have padding
    expect(result.code).toContain("padding");
    // Should have margin
    expect(result.code).toContain("margin");
    // Should have display flex
    expect(result.code).toContain("flex");
  });

  it("should transform @calc rules into calc() expressions", async () => {
    const inputCSS = `
      @calc _abc123 100vw - 1rem { }
      @calc _def456 50% + 10px { }
    `;

    const result = await Effect.runPromise(processCSS(inputCSS));

    // Should have calc expressions
    expect(result.code).toContain("calc");
    expect(result.code).toContain("100vw");
    expect(result.code).toContain("1rem");
  });

  it("should wrap rules in CSS layers", async () => {
    const inputCSS = `
      @atomic padding 1rem { }
    `;

    const result = await Effect.runPromise(processCSS(inputCSS));

    // Should have layer
    expect(result.code).toContain("@layer");
    // Should have our layer name
    expect(result.code).toContain("_.b");
  });

  it("should deduplicate identical atoms", async () => {
    const inputCSS = `
      @atomic padding 1rem { }
      @atomic padding 1rem { }
      @atomic padding 1rem { }
    `;

    const result = await Effect.runPromise(processCSS(inputCSS));

    // Should only have one padding rule
    const matches = result.code.match(/padding/g);
    expect(matches?.length).toBe(1);
  });

  it("should handle complex calc expressions", async () => {
    const inputCSS = `
      @calc _xyz789 ( 100vw - 2rem ) { }
    `;

    const result = await Effect.runPromise(processCSS(inputCSS));

    expect(result.code).toContain("calc");
    // LightningCSS may simplify the expression, so just check it's a calc
    expect(result.code).toContain("width");
  });

  it("should minify output when minify option is true", async () => {
    const inputCSS = `
      @atomic padding 1rem { }
      @atomic margin 0.5rem { }
    `;

    const result = await Effect.runPromise(
      processCSS(inputCSS, { minify: true })
    );

    // Minified CSS should not have extra whitespace
    expect(result.code).not.toContain("  ");
    expect(result.code).not.toContain("\n\n");
  });
});
