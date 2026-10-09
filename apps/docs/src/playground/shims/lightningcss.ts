// lightningcss for lowered.ts and the sheet: the wasm build, loaded before the first compile (`ready`). The native `code` is
// a Buffer, whose toString() is the text; here a Uint8Array, so it is wrapped.
import init, { browserslistToTargets, transform as run } from "lightningcss-wasm";
import wasm from "lightningcss-wasm/lightningcss_node.wasm?url";

export { browserslistToTargets };

type Options = Parameters<typeof run>[0];

export const ready = init(fetch(wasm) as unknown as string);

export const transform = (options: Options) => {
  const out = run(options);
  // decoded now, from a copy: the view is into the module's memory, which the next call reuses
  const text = new TextDecoder().decode(out.code.slice());
  return { ...out, code: { toString: () => text } };
};
