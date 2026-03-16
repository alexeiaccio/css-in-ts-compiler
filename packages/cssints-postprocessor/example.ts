/**
 * Example: Full CSS-in-TS Workflow
 * 
 * This example demonstrates the complete CSS-in-TS workflow:
 * 1. Define styles using type-safe macro functions
 * 2. Generate placeholder CSS
 * 3. Transform to actual CSS with the post-processor
 */

import { Effect } from "effect";
import { processCSS } from "./src/index.js";

// ============================================================================
// Step 1: Define Styles (Macro Phase)
// ============================================================================
// In real usage, these would be Parcel macros:
// import * as css from "cssints" with { type: "cssints" };
// const padding = css.p(4);  // Generates: @atomic padding 1rem { }

// For this example, we'll show what the macro output looks like:
const placeholderCSS = `
  /* Atomic utilities */
  @atomic padding 1rem { }
  @atomic margin 0.5rem { }
  @atomic display flex { }
  @atomic align-items center { }
  
  /* Responsive calc */
  @calc _responsiveWidth 100vw - 2rem { }
  
  /* Color token */
  @property --color-primary {
    syntax: "<color>";
    inherits: true;
    initial-value: #3b82f6;
  }
`;

// ============================================================================
// Step 2: Process with Post-Processor
// ============================================================================

async function main() {
  console.log("=== CSS-in-TS Workflow Example ===\n");
  
  console.log("Input (Placeholder CSS):");
  console.log(placeholderCSS);
  console.log("\n" + "=".repeat(50) + "\n");

  const result = await Effect.runPromise(
    processCSS(placeholderCSS, { minify: false })
  );

  console.log("Output (Actual CSS):");
  console.log(result.code);
}

main().catch(console.error);

// ============================================================================
// Expected Output:
// ============================================================================
/*
@layer _.a, _.b, _.c;

@property --color-primary {
  syntax: "<color>";
  inherits: true;
  initial-value: #3b82f6;
}

@layer _.b {
  ._a1b2c3 { padding: 1rem; }
  ._d4e5f6 { margin: 0.5rem; }
  ._g7h8i9 { display: flex; }
  ._j0k1l2 { align-items: center; }
  ._m3n4o5 { width: calc(100vw - 2rem); }
}
*/
