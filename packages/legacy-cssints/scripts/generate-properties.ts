import { Effect, Console, Data, Layer } from "effect";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
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

interface PropertyDef {
  name: string;
  cssName: string;
  description?: string;
}

export const main = Effect.gen(function* () {
  const fileService = yield* FileService;

  yield* Console.log("🔍 Extracting property schemas...");

  const properties = extractProperties(astData);

  yield* Console.log(`📝 Generating ${properties.length} property functions...`);

  const code = generatePropertyCode(properties);

  const outputPath = resolve(OUTPUT_DIR, "properties.gen.ts");

  yield* fileService.writeFileString(outputPath, code);



  yield* Console.log("✅ Property functions generated!");
  yield* Console.log(`   Written to: ${outputPath}`);

  return properties;
});

function extractProperties(astData: unknown): PropertyDef[] {
  const defs = astData as { definitions?: Record<string, unknown> };
  const properties: PropertyDef[] = [];

  if (!defs.definitions) return properties;

  for (const [name, def] of Object.entries(defs.definitions)) {
    if (!name.endsWith("Value")) continue;

    // Remove underscores from the type name for cleaner API
    const cleanName = name.replace(/_/g, "");

    const cssName = name
      .replace(/Value$/, "")
      .replace(/_/g, "-")
      .toLowerCase();

    properties.push({
      name: cleanName,
      cssName,
      description: (def as { description?: string }).description,
    });
  }

  return properties;
}

function generatePropertyCode(properties: PropertyDef[]): string {
  const lines: string[] = [
    "// Auto-generated CSS property functions",
    "// Generated from LightningCSS ast.json",
    "",
    "import { style } from './style.js';",
    "",
  ];

  for (const prop of properties) {
    const fnName = toCamelCase(prop.cssName);

    if (prop.description) {
      lines.push(`/** ${prop.description} */`);
    }

    lines.push(`export function ${fnName}(value: ${prop.name}): string {`);
    lines.push(`  return style({ "${prop.cssName}": value });`);
    lines.push(`}`);
    lines.push("");
  }

  return lines.join("\n");
}

function toCamelCase(kebab: string): string {
  return kebab
    .split("-")
    .map((part, i) =>
      i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join("");
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
