import { parentPort } from "node:worker_threads";

import { buildPages } from "./markdown.ts";

parentPort?.postMessage(await buildPages());
