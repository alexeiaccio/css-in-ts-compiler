import assert from "node:assert/strict";

import { graphLayoutBridge } from "@cssints/apg-specs/patterns/graph-layout.bridge";
import { parseScenarioFile, replayScenario } from "@cssints/apg-specs/scenario";
import scenariosJson from "@cssints/apg-specs/scenarios/patterns/graph-layout.spec.json" with { type: "json" };

import { engineDriver } from "./engine-driver.ts";

// The eight scenarios the reference model and elk-rs already pass, against the engine: same vocabulary, same layers.
const file = parseScenarioFile(scenariosJson);

for (const scenario of file.scenarios) {
  const result = await replayScenario(scenario, graphLayoutBridge, () => engineDriver());
  assert.equal(result.status, "passed", `${scenario.id}: ${JSON.stringify(result)}`);
  console.log(`ok ${scenario.id}`);
}

console.log(`${file.scenarios.length} scenarios, the engine like the spec`);
