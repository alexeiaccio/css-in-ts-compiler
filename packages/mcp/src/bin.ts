#!/usr/bin/env node
// cssints-mcp: the MCP server over stdio. stdout carries the protocol only: a console.log of a module the compile tool
// evaluates (user code) goes to stderr with the logs. The server stops when the client closes stdin (MCP stdio).
import { NodeRuntime, NodeStdio } from "@effect/platform-node";
import { Effect, Layer } from "effect";

import { layer } from "./server.ts";

// oxlint-disable-next-line no-console -- stdout is the protocol: user code that logs while it is evaluated goes to stderr
console.log = console.info = console.error;

const stdinClosed = Effect.callback<void>((resume) => {
  process.stdin.once("end", () => resume(Effect.void));
});

NodeRuntime.runMain(
  Effect.raceFirst(Layer.launch(layer.pipe(Layer.provide(NodeStdio.layer))), stdinClosed),
);
