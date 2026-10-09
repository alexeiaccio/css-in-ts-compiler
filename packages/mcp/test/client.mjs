// An MCP client in-process: the SDK's Client over a transport that feeds the server's Stdio (a test Stdio of effect:
// stdin a stream of the client's messages, stdout a sink that hands each line back), so a test calls the tools as an
// agent does, without a child process.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Effect, Fiber, Layer, Queue, Sink, Stdio, Stream } from "effect";

import { layer } from "../src/server.ts";

export async function connect() {
  const input = Effect.runSync(Queue.unbounded());
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";
  const transport = {
    start: () => Promise.resolve(),
    send: (message) =>
      Promise.resolve(Queue.offerUnsafe(input, encoder.encode(`${JSON.stringify(message)}\n`))),
    async close() {
      await Effect.runPromise(Fiber.interrupt(fiber));
      transport.onclose?.();
    },
  };
  const stdout = Sink.forEach((chunk) =>
    Effect.sync(() => {
      buffer += typeof chunk === "string" ? chunk : decoder.decode(chunk);
      let i;
      while ((i = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, i);
        buffer = buffer.slice(i + 1);
        if (line.trim()) transport.onmessage?.(JSON.parse(line));
      }
    }),
  );
  const stdio = Stdio.layerTest({ stdin: Stream.fromQueue(input), stdout: () => stdout });
  const fiber = Effect.runFork(Layer.launch(layer.pipe(Layer.provide(stdio))));
  const client = new Client({ name: "cssints-mcp-test", version: "0" });
  await client.connect(transport);
  return client;
}
