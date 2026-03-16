import { Effect, Console, Layer } from "effect";
import { main as generateAst } from "./generate-ast.ts";
import { main as generateSchema } from "./generate-schema.ts";
import { main as generateProperties } from "./generate-properties.ts";
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import * as NodePath from "@effect/platform-node/NodePath";
import { FileService } from "./file-service.ts";

const main = Effect.gen(function* () {
  yield* Console.log("🚀 Starting generation pipeline...\n");

  // Step 1: Generate AST from lightningcss (if needed)
  yield* Console.log("📄 Step 1: Clone & build lightningcss AST");
  const astResult = yield* generateAst;

  if (astResult.skipped) {
    yield* Console.log("   ✅ AST unchanged - skipping");
  } else {
    yield* Console.log("   ✅ AST generated/updated");
  }

  // Step 2: Generate schema code from AST
  yield* Console.log("\n📄 Step 2: Generate schema code from AST");
  yield* generateSchema;

  // Step 3: Generate property functions
  yield* Console.log("\n📄 Step 3: Generate property functions");
  yield* generateProperties;

  yield* Console.log("\n✅ All generation complete!\n");
});

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
