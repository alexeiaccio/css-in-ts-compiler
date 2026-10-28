// The Sky page's thread loader for the host (`solid/main.ts`), chosen by the flags: the AppView's getPostThread by
// default, apps/csssky's recorded answer with `--offline`, and the two states' frames with `--pending` (a promise that
// never settles: the loading row) and `--fail` (a loader that throws: the error row and its retry).
//
// **A frame never touches the network.** A headless run (`--png`/`--expect`) is offline whether or not the flag is given:
// a stored frame that depended on a request would be a flaky oracle, and this machine has none to make. The window
// fetches, which is the page's real path; `--offline` gives the window the fixture too.
import { readFileSync } from "node:fs";

import { fetchThread, screenOf, type Loader, type ThreadScreen } from "../app/Sky.tsx";

/** apps/csssky's recorded `getPostThread` answer (test/fixtures/thread.json): the thread the page shows for whichever
 *  card is pressed, as the terminal's and the TUI's frames show it. */
const FIXTURE = new URL("../../../apps/csssky/test/fixtures/thread.json", import.meta.url).pathname;

export function loadSky(argv: readonly string[]): Loader {
  if (argv.includes("--pending")) return () => new Promise<ThreadScreen>(() => {});
  if (argv.includes("--fail"))
    return () => {
      throw new Error("sky: --fail");
    };
  if (argv.includes("--offline") || argv.includes("--png") || argv.includes("--expect")) {
    let screen: ThreadScreen | undefined;
    return () =>
      (screen ??= screenOf((JSON.parse(readFileSync(FIXTURE, "utf8")) as { thread: unknown }).thread));
  }
  return fetchThread;
}
