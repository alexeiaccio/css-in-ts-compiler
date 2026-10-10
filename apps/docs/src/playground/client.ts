// The page's side of the compile worker: one worker, started on the first compile, ended and started again when a compile takes
// longer than the limit (user code that loops at build time). A message sent while the worker still loads its wasm would be
// dropped (its handler is set after its imports ran), so a compile waits for the worker's `ready`.
import type { Compiled, Files } from "./compile.ts";

export type { Compiled, Diagnostic, Files } from "./compile.ts";

const LIMIT = 15_000;

export interface Engine {
  compile: (files: Files) => Promise<Compiled>;
  /** the body of the function that gives `cx` and `_cv` to the preview */
  runtime: () => Promise<string>;
  stop: () => void;
}

interface Reply {
  id?: number;
  result?: Compiled;
  ready?: boolean;
  runtime?: string;
}

const failure = (message: string): Compiled => ({
  ok: false,
  errors: [{ file: "", message, line: 1, column: 1, frame: "" }],
  warnings: [],
});

export const start = (): Engine => {
  let current: { worker: Worker; runtime: Promise<string> } | undefined;
  let next = 0;
  const waiting = new Map<number, (c: Compiled) => void>();

  const open = () => {
    const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    const ready = Promise.withResolvers<string>();
    worker.onmessage = (e: MessageEvent<Reply>) => {
      if (e.data.ready) ready.resolve(e.data.runtime!);
      else if (e.data.id !== undefined) waiting.get(e.data.id)?.(e.data.result!);
    };
    worker.onerror = (e) => {
      for (const done of waiting.values()) done(failure(`the engine failed: ${e.message}`));
      waiting.clear();
    };
    return (current = { worker, runtime: ready.promise });
  };

  const stop = () => {
    current?.worker.terminate();
    current = undefined;
  };

  return {
    compile: async (files) => {
      const { worker, runtime } = current ?? open();
      await runtime;
      const id = next++;
      // oxlint-disable-next-line promise/avoid-new -- a reply arrives as a message
      return new Promise<Compiled>((resolve) => {
        const timer = setTimeout(() => {
          stop();
          waiting.delete(id);
          resolve(
            failure(
              `the build took more than ${LIMIT / 1000} seconds: a loop in the code that runs at build time?`,
            ),
          );
        }, LIMIT);
        waiting.set(id, (c) => {
          clearTimeout(timer);
          waiting.delete(id);
          resolve(c);
        });
        worker.postMessage({ id, files });
      });
    },
    runtime: () => (current ?? open()).runtime,
    stop,
  };
};
