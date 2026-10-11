import { parentPort } from "node:worker_threads";

import { results } from "./examples.ts";

parentPort?.postMessage(await results());
