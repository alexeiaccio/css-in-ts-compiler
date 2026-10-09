// The compile worker: the engine and its wasm parsers live here, off the page's thread, and a build-time loop in the user's code
// costs a worker (client.ts ends it), not the page. Messages: { source, id } in; { ready, runtime } once, then { id, result }.
import { compile, loaded, runtimeBody } from "./compile.ts";

self.onmessage = async (e: MessageEvent<{ id: number; source: string }>) => {
  self.postMessage({ id: e.data.id, result: await compile(e.data.source) });
};

await loaded;
self.postMessage({ ready: true, runtime: runtimeBody() });
