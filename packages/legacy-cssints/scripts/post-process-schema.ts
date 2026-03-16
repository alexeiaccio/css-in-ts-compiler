import { Effect, Console, Data } from "effect";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import * as NodePath from "@effect/platform-node/NodePath";
import { FileService } from "./file-service.ts";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const OUTPUT_DIR = resolve(__dirname, "../src/generated");
const SCHEMA_FILE = resolve(OUTPUT_DIR, "ast-schema.gen.ts");

export class PostProcessError extends Data.TaggedError("PostProcessError")<{
  readonly reason: string;
}> {}

interface SchemaDeclaration {
  name: string;
  code: string;
  dependencies: Set<string>;
  line: number;
}

export const main = Effect.gen(function* () {
  const fileService = yield* FileService;

  yield* Console.log("🔧 Post-processing generated schema file...");

  const content = yield* fileService.readFileString(SCHEMA_FILE);
  const lines = content.split("\n");

  const declarations = parseDeclarations(lines);
  const sortedDeclarations = topologicalSort(declarations);

  const processedLines = generateProcessedLines(sortedDeclarations, lines, declarations);

  yield* fileService.writeFileString(SCHEMA_FILE, processedLines);

  yield* Console.log("✅ Post-processing complete!");
  yield* Console.log(`   Reordered ${declarations.size} schemas`);
  yield* Console.log(`   Fixed type annotations`);
  yield* Console.log(`   Fixed typos`);
});

function parseDeclarations(lines: string[]): Map<string, SchemaDeclaration> {
  const declarations = new Map<string, SchemaDeclaration>();
  let currentDeclaration: SchemaDeclaration | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();

    if (trimmed.startsWith("// Auto-generated")) {
      continue;
    }

    if (trimmed.startsWith("import * as Schema from")) {
      continue;
    }

    if (trimmed === "" || trimmed.startsWith("//")) {
      if (currentDeclaration) {
        declarations.set(currentDeclaration.name, currentDeclaration);
        currentDeclaration = null;
      }
      continue;
    }

    const exportMatch = trimmed.match(/^export const (\w+)(: Schema\.Schema<unknown>)? = /);
    if (exportMatch) {
      if (currentDeclaration) {
        declarations.set(currentDeclaration.name, currentDeclaration);
      }
      const name = exportMatch[1]!;
      currentDeclaration = {
        name,
        code: line,
        dependencies: new Set<string>(extractDependencies(line)),
        line: i,
      };
      continue;
    }

    if (currentDeclaration) {
      const deps = extractDependencies(line);
      deps.forEach((dep) => {
        if (currentDeclaration) {
          currentDeclaration.dependencies.add(dep);
        }
      });
      currentDeclaration.code += "\n" + line;
    }
  }

  if (currentDeclaration) {
    declarations.set(currentDeclaration.name, currentDeclaration);
  }

  return declarations;
}

function extractDependencies(line: string): string[] {
  const dependencies: string[] = [];
  const seen = new Set<string>();

  // Match schema references in specific contexts:
  // - Schema.Array(SchemaName)
  // - Schema.Union([SchemaName])
  // - Schema.Tuple([SchemaName])
  // - Schema.suspend(() => SchemaName)
  // - Property references: "value": SchemaName
  const patterns = [
    /Schema\.(?:Array|Union|Tuple)\s*\(\s*(?:\[\s*)?([A-Z][a-zA-Z0-9]*)/g,
    /Schema\.suspend\s*\([^)]*=>\s*([A-Z][a-zA-Z0-9]*)/g,
    /"[^"]+":\s*([A-Z][a-zA-Z0-9]+)/g,
  ];

  for (const pattern of patterns) {
    const matches = line.matchAll(pattern);
    for (const match of matches) {
      const name = match[1]!;
      if (name && 
          !["Schema", "String", "Number", "Boolean", "Array", "Unknown", "Null", "The", "Description"].includes(name) &&
          !seen.has(name)) {
        dependencies.push(name);
        seen.add(name);
      }
    }
  }

  return dependencies;
}

function topologicalSort(declarations: Map<string, SchemaDeclaration>): SchemaDeclaration[] {
  const sorted: SchemaDeclaration[] = [];
  const visited = new Set<string>();
  const temp = new Set<string>();

  function visit(name: string) {
    if (temp.has(name)) {
      throw new Error(`Circular dependency detected: ${name}`);
    }
    if (visited.has(name)) {
      return;
    }

    const declaration = declarations.get(name);
    if (!declaration) {
      return;
    }

    temp.add(name);

    for (const dep of declaration.dependencies) {
      visit(dep);
    }

    temp.delete(name);
    visited.add(name);
    sorted.push(declaration);
  }

  for (const name of declarations.keys()) {
    visit(name);
  }

  return sorted;
}

function generateProcessedLines(
  sortedDeclarations: SchemaDeclaration[],
  originalLines: string[],
  declarations: Map<string, SchemaDeclaration>
): string {
  const lines: string[] = [];
  const declarationNames = new Set(sortedDeclarations.map(d => d.name));
  const circularPairs = findCircularPairs(declarations);
  const circularNames = new Set(circularPairs.flatMap(p => [p.first, p.second]));

  // Track which circular pair schemas have been processed
  const processedCircular = new Set<string>();

  for (const line of originalLines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("// Auto-generated")) {
      lines.push(line);
      continue;
    }

    if (trimmed.startsWith("import * as Schema from")) {
      lines.push(line);
      continue;
    }

    if (trimmed === "" || trimmed.startsWith("//")) {
      lines.push(line);
      continue;
    }

    const exportMatch = trimmed.match(/^export const (\w+)(: Schema\.Schema<unknown>)? = /);
    if (exportMatch && exportMatch[1] && declarationNames.has(exportMatch[1])) {
      const decl = sortedDeclarations.find(d => d.name === exportMatch[1]);
      if (decl) {
        // Check if this is part of a circular pair and hasn't been processed yet
        if (circularNames.has(decl.name) && !processedCircular.has(decl.name)) {
          // Find the pair
          const pair = circularPairs.find(p => p.first === decl.name || p.second === decl.name);
          if (pair) {
            // Get both declarations and convert to class
            const firstDecl = declarations.get(pair.first)!;
            const secondDecl = declarations.get(pair.second)!;

            // Add both as classes
            lines.push(`// Circular dependency: ${pair.first} <-> ${pair.second}`);
            lines.push(convertToClass(firstDecl.name, firstDecl.code));
            lines.push(convertToClass(secondDecl.name, secondDecl.code));

            processedCircular.add(pair.first);
            processedCircular.add(pair.second);
            continue;
          }
        } else if (circularNames.has(decl.name)) {
          // Already processed as part of a pair
          continue;
        }

        const fixedCode = fixDeclarationCode(decl.code, decl.name);
        lines.push(fixedCode);
        continue;
      }
    }
  }

  return lines.join("\n");
}

function fixDeclarationCode(code: string, name: string): string {
  let fixedCode = code;

  if (name === "StyleSheet" && !fixedCode.includes(": Schema.Schema<unknown>")) {
    fixedCode = fixedCode.replace(
      "export const StyleSheet = ",
      "export const StyleSheet: Schema.Schema<unknown> = "
    );
  }

  return fixedCode;
}

interface CircularPair {
  first: string;
  second: string;
}

function findCircularPairs(declarations: Map<string, SchemaDeclaration>): CircularPair[] {
  const pairs: CircularPair[] = [];
  const processed = new Set<string>();

  for (const [name, decl] of declarations) {
    for (const dep of decl.dependencies) {
      const depDecl = declarations.get(dep);
      if (depDecl && depDecl.dependencies.has(name) && !processed.has(name)) {
        pairs.push({ first: name, second: dep });
        processed.add(name);
        processed.add(dep);
      }
    }
  }

  return pairs;
}

function convertToClass(name: string, code: string): string {
  const schemaMatch = code.match(/^export const \w+: Schema\.Schema<unknown> = (.+);?$/);
  if (!schemaMatch) return code;

  const schemaCode = schemaMatch[1];

  return `export class ${name} extends Schema.Opaque<${name}>()(${schemaCode}) {}`;
}

Effect.runPromiseExit(
  main.pipe(
    Effect.provide(FileService.layer),
    Effect.provide(NodeFileSystem.layer),
    Effect.provide(NodePath.layer),
  )
).then(
  (exit) => {
    if (exit._tag === "Failure") {
      Console.error("❌ Failed:", exit.cause);
      process.exit(1);
    }
  }
);
