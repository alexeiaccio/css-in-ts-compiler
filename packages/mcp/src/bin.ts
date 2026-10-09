#!/usr/bin/env node
// cssints-mcp: the MCP server over stdio. stdout carries the protocol only: a console.log of a module the compile tool
// evaluates (user code) goes to stderr with the logs.
import { NodeRuntime, NodeStdio } from "@effect/platform-node";
import { Layer } from "effect";

import { layer } from "./server.ts";

// oxlint-disable-next-line no-console -- stdout is the protocol: user code that logs while it is evaluated goes to stderr
console.log = console.info = console.error;

NodeRuntime.runMain(Layer.launch(layer.pipe(Layer.provide(NodeStdio.layer))));
