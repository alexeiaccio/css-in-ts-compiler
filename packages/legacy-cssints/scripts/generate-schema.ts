import { Effect, Console, Data, Layer } from "effect";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fromSchemaDraft07 } from "effect/JsonSchema";
import {
  fromJsonSchemaMultiDocument,
  toCodeDocument,
} from "effect/SchemaRepresentation";
import { FileService } from "./file-service.ts";
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import * as NodePath from "@effect/platform-node/NodePath";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const OUTPUT_DIR = resolve(__dirname, "../src/generated");

export class GenerationError extends Data.TaggedError("GenerationError")<{
  readonly step: string;
  readonly reason: string;
}> {}

import astData from "../data/ast.json" with { type: "json" };

export const main = Effect.gen(function* () {
  const fileService = yield* FileService;

  yield* Console.log("🔄 Converting JSON Schema to Effect Schema...");

  const document = fromSchemaDraft07(astData);

  yield* Console.log("📦 Creating multi-document...");
  const multiDocument = fromJsonSchemaMultiDocument({
    dialect: document.dialect,
    schemas: [document.schema],
    definitions: document.definitions,
  });

  yield* Console.log("⚙️  Generating TypeScript code...");
  const code = toCodeDocument(multiDocument);

  yield* Console.log(`📝 Generated ${code.codes.length} schemas`);
  yield* Console.log(`   Recursives: ${Object.keys(code.references.recursives).length}`);
  yield* Console.log(`   Non-recursives: ${code.references.nonRecursives.length}`);

  const outputPath = resolve(OUTPUT_DIR, "ast-schema.gen.ts");
  const content = generateFileContent(code);

  yield* fileService.writeFileString(outputPath, content);



  yield* Console.log("✅ Schema generation complete!");
  yield* Console.log(`   Written to: ${outputPath}`);

  return code;
});

interface SchemaCode {
  runtime: string;
}

interface NonRecursiveSchema {
  $ref?: string;
  code?: SchemaCode;
}

interface ToCodeDocumentResult {
  codes: Array<unknown>;
  references: {
    recursives: Record<string, SchemaCode>;
    nonRecursives: Array<unknown>;
  };
}

interface SchemaCode {
  runtime: string;
}

interface NonRecursiveSchema {
  $ref?: string;
  code?: SchemaCode;
}

function extractSchemaCode(item: unknown): SchemaCode {
  if (typeof item === "object" && item !== null && "runtime" in item) {
    return item as SchemaCode;
  }
  return { runtime: "Schema.Never" };
}

function extractNonRecursiveSchema(item: unknown): { refName?: string; runtime: string } {
  if (typeof item === "object" && item !== null) {
    const obj = item as NonRecursiveSchema;
    const codeObj = obj.code;
    
    if (codeObj && typeof codeObj.runtime === "string") {
      return {
        refName: obj.$ref,
        runtime: codeObj.runtime.trim(),
      };
    }
  }
  
  return { runtime: "// Unexpected schema structure" };
}

interface SchemaDefinition {
  name: string;
  cleanName: string;
  runtime: string;
  dependencies: Set<string>;
}

function extractDependencies(runtime: string): Set<string> {
  const deps = new Set<string>();
  const patterns = [
    /Schema\.(?:Array|Union|Tuple)\s*\(\s*(?:\[\s*)?([A-Z][a-zA-Z0-9]*)/g,
    /Schema\.suspend\s*\([^)]*=>\s*([A-Z][a-zA-Z0-9]*)/g,
    /"[^"]+":\s*([A-Z][a-zA-Z0-9]+)/g,
  ];

  for (const pattern of patterns) {
    const matches = runtime.matchAll(pattern);
    for (const match of matches) {
      const name = match[1]!;
      if (name && !["Schema", "String", "Number", "Boolean", "Array", "Unknown", "Null", "The", "Description"].includes(name)) {
        deps.add(name);
      }
    }
  }

  return deps;
}

function topologicalSort(schemas: SchemaDefinition[]): SchemaDefinition[] {
  const sorted: SchemaDefinition[] = [];
  const visited = new Set<string>();
  const temp = new Set<string>();
  const schemaMap = new Map(schemas.map(s => [s.cleanName, s]));

  function visit(name: string) {
    if (temp.has(name)) {
      // Circular dependency - schema will reference itself via Schema.suspend
      return;
    }
    if (visited.has(name)) {
      return;
    }

    const schema = schemaMap.get(name);
    if (!schema) {
      return;
    }

    temp.add(name);

    for (const dep of schema.dependencies) {
      visit(dep);
    }

    temp.delete(name);
    visited.add(name);
    sorted.push(schema);
  }

  for (const schema of schemas) {
    visit(schema.cleanName);
  }

  return sorted;
}

function generateFileContent(code: {
  codes: readonly unknown[];
  references: {
    recursives: Record<string, { runtime: string }>;
    nonRecursives: readonly unknown[];
  };
}): string {
  const codes = code.codes.map(extractSchemaCode);
  const recursives = code.references.recursives;
  const nonRecursives = code.references.nonRecursives;
  
  // Create a map of all schema names to their clean names (underscores removed)
  // Exclude basic types that map to Effect Schema built-ins
  const basicTypes = new Set(["String", "Number", "Boolean"]);
  const allSchemaNames = new Set([
    "StyleSheet", // Main schema
    ...Object.keys(recursives),
    ...nonRecursives.map((n) => {
      const { refName } = extractNonRecursiveSchema(n);
      return refName;
    }).filter((name): name is string => name !== undefined && !basicTypes.has(name)),
  ]);
  
  const nameToCleanName = new Map<string, string>();
  for (const name of allSchemaNames) {
    // Convert snake_case or Pascal_Snake_Case to PascalCase
    // e.g., "Calc_for_Length" -> "CalcForLength"
    const cleanName = name
      .split('_')
      .map((part, index) => {
        if (part.length === 0) return '';
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      })
      .join('');
    nameToCleanName.set(name, cleanName);
  }

  // Collect all schemas with their dependencies
  const allSchemas: SchemaDefinition[] = [];

  // Main schema (StyleSheet)
  if (codes[0]) {
    const mainRuntime = codes[0].runtime;
    const cleanRuntime = applyNameReplacements(mainRuntime, nameToCleanName);
    allSchemas.push({
      name: "StyleSheet",
      cleanName: "StyleSheet",
      runtime: cleanRuntime,
      dependencies: extractDependencies(cleanRuntime),
    });
  }

  // Recursive schemas
  for (const [name, def] of Object.entries(recursives)) {
    let runtimeCode = def.runtime;
    
    // Replace type annotations that reference the schema name
    const typeAnnotationRegex = new RegExp(`Schema\\.Codec<${name}>`, "g");
    runtimeCode = runtimeCode.replace(typeAnnotationRegex, "Schema.Codec<unknown>");
    
    const cleanName = nameToCleanName.get(name)!;
    const cleanRuntime = applyNameReplacements(runtimeCode, nameToCleanName);
    
    allSchemas.push({
      name,
      cleanName,
      runtime: cleanRuntime,
      dependencies: extractDependencies(cleanRuntime),
    });
  }

  // Non-recursive schemas
  for (const n of nonRecursives) {
    const { refName, runtime } = extractNonRecursiveSchema(n);

    if (!refName) {
      continue;
    }

    const cleanName = nameToCleanName.get(refName);
    if (!cleanName) {
      // Skip schemas without a clean name mapping (e.g., basic types)
      continue;
    }

    const cleanRuntime = applyNameReplacements(runtime, nameToCleanName);

    allSchemas.push({
      name: refName,
      cleanName,
      runtime: cleanRuntime,
      dependencies: extractDependencies(cleanRuntime),
    });
  }

  // Sort schemas by dependencies (topological sort)
  const sortedSchemas = topologicalSort(allSchemas);

  // Generate output - all schemas in one class with lazy getters
  const lines: string[] = [
    "// Auto-generated from LightningCSS ast.json",
    "// Generated by Effect Schema Representation",
    "",
    `import * as Schema from "effect/Schema";`,
    "",
    "// All schemas in one class with lazy getters to handle circular dependencies",
    "export class Schemas {",
  ];

  // Output all schemas as lazy getters in dependency order
  for (const schema of sortedSchemas) {
    const prefixedRuntime = prefixSchemaReferences(schema.runtime, allSchemaNames);
    lines.push(`  static get ${schema.cleanName}() { return ${prefixedRuntime}; }`);
  }

  lines.push("}");
  lines.push("");
  
  // Export individual schemas for convenience
  for (const schema of sortedSchemas) {
    lines.push(`export const ${schema.cleanName} = Schemas.${schema.cleanName};`);
  }

  return lines.join("\n");
}

function prefixSchemaReferences(runtime: string, schemaNames: Set<string>): string {
  let result = runtime;

  // Basic types should not be prefixed - they use Effect Schema built-ins
  const basicTypes = new Set(["String", "Number", "Boolean"]);

  // Sort names by length (longest first) to avoid partial replacements
  const sortedNames = Array.from(schemaNames)
    .filter(name => name !== "StyleSheet" && !basicTypes.has(name)) // Exclude StyleSheet and basic types
    .sort((a, b) => b.length - a.length);

  for (const name of sortedNames) {
    // Replace schema references that are not already prefixed with Schema.
    // Match: word boundary + name + word boundary, but not preceded by "Schema."
    // Use negative lookbehind to avoid replacing "Schema.String" -> "Schema.Schemas.String"
    const regex = new RegExp(`(?<!Schema\\.)\\b${name}\\b`, 'g');
    // Prefix with Schemas. for all schema references
    result = result.replace(regex, `Schemas.${name}`);
  }

  return result;
}

function applyNameReplacements(runtime: string, nameToCleanName: Map<string, string>): string {
  // Process in order of longest names first to avoid partial replacements
  const sortedNames = Array.from(nameToCleanName.entries())
    .filter(([original, clean]) => original !== clean)
    .sort(([a], [b]) => b.length - a.length); // Longest first
  
  let result = runtime;
  for (const [original, clean] of sortedNames) {
    result = result.split(original).join(clean);
  }
  
  return result;
}

Effect.runPromiseExit(
  main.pipe(
    Effect.provide(FileService.layer),
    Effect.provide(NodeFileSystem.layer),
    Effect.provide(NodePath.layer),
  ),
).then((exit) => {
  if (exit._tag === "Failure") {
    Console.error("❌ Failed:", exit.cause);
    process.exit(1);
  }
});
