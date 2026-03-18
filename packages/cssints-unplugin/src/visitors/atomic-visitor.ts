/**
 * Atomic CSS Visitor
 * Transforms @atomic placeholder rules into actual CSS with hashed class names
 */

import { Effect, Console } from "effect";
import type { Rule, Declaration } from "lightningcss";
import { VisitorError } from "../errors.js";

// Track processed atoms to avoid duplicates
const processedAtoms = new Map<string, string>();

/**
 * Generate hash for atomic CSS
 */
const generateAtomHash = (key: string): string => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return "_" + Math.abs(hash).toString(16).padStart(6, "0").slice(0, 6);
};

/**
 * Parse atomic declaration from property and value
 */
const parseAtomicDeclaration = (property: string, value: string): Declaration[] => {
  // Handle shorthand properties
  switch (property) {
    case "padding-x":
      return [
        { property: "padding-left" as const, value: parseCSSValue(value) },
        { property: "padding-right" as const, value: parseCSSValue(value) },
      ];
    case "padding-y":
      return [
        { property: "padding-top" as const, value: parseCSSValue(value) },
        { property: "padding-bottom" as const, value: parseCSSValue(value) },
      ];
    case "margin-x":
      return [
        { property: "margin-left" as const, value: parseCSSValue(value) },
        { property: "margin-right" as const, value: parseCSSValue(value) },
      ];
    case "margin-y":
      return [
        { property: "margin-top" as const, value: parseCSSValue(value) },
        { property: "margin-bottom" as const, value: parseCSSValue(value) },
      ];
    default:
      return [{ property: property as any, value: parseCSSValue(value) }];
  }
};

/**
 * Parse CSS value into LightningCSS AST
 */
const parseCSSValue = (value: string): any => {
  // Handle different value types
  if (value.endsWith("rem")) {
    return {
      type: "length",
      value: {
        unit: "rem",
        value: parseFloat(value),
      },
    };
  }
  if (value.endsWith("px")) {
    return {
      type: "length",
      value: {
        unit: "px",
        value: parseFloat(value),
      },
    };
  }
  if (value.endsWith("%")) {
    return {
      type: "percentage",
      value: parseFloat(value) / 100,
    };
  }
  if (value.endsWith("vw") || value.endsWith("vh")) {
    return {
      type: "length",
      value: {
        unit: value.slice(-2),
        value: parseFloat(value),
      },
    };
  }
  if (value.endsWith("dvw") || value.endsWith("dvh")) {
    return {
      type: "length",
      value: {
        unit: value.slice(-3),
        value: parseFloat(value),
      },
    };
  }
  // For keywords like "flex", "center", "red"
  return {
    type: "keyword",
    value,
  };
};

/**
 * Create atomic CSS visitor
 * Transforms @atomic rules into actual style rules with hashed class names
 */
export const createAtomicVisitor = () => {
  return {
    Rule: {
      custom: {
        atomic: (rule: any): Rule | Rule[] => {
          return Effect.runSync(
            Effect.gen(function* () {
              yield* Console.debug(`Processing @atomic rule`);

              // Parse the prelude: "property value"
              const prelude = rule.prelude?.value || "";
              const [property, ...valueParts] = prelude.split(" ");
              const value = valueParts.join(" ");

              if (!property || !value) {
                return yield* Effect.fail(
                  new VisitorError({
                    message: "Invalid @atomic rule: missing property or value",
                    visitorName: "atomic",
                    rule: prelude,
                  })
                );
              }

              const atomKey = `${property}:${value}`;

              // Check for duplicates
              if (processedAtoms.has(atomKey)) {
                yield* Console.debug(`Skipping duplicate atom: ${atomKey}`);
                return [];
              }

              const className = generateAtomHash(atomKey);
              processedAtoms.set(atomKey, className);

              yield* Console.debug(`Generated atom: .${className} { ${property}: ${value} }`);

              // Parse declarations
              const declarations = parseAtomicDeclaration(property, value);

              // Return style rule
              return {
                type: "style",
                value: {
                  selectors: [[{ type: "class", name: className }]],
                  declarations: {
                    declarations,
                  },
                  loc: { source_index: 0, line: 0, column: 0 },
                },
              } as unknown as Rule;
            })
          );
        },
      },
    },
  };
};

/**
 * Reset the atomic registry (useful for testing)
 */
export const resetAtomicRegistry = (): void => {
  processedAtoms.clear();
};
