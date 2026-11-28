import assert from "node:assert/strict";

import { graphLayoutLabelsBridge } from "@cssints/apg-specs/patterns/graph-layout-labels.bridge";
import { parseScenarioFile, replayScenario } from "@cssints/apg-specs/scenario";
import scenariosJson from "@cssints/apg-specs/scenarios/patterns/graph-layout-labels.spec.json" with { type: "json" };

import { labelsDriver } from "./engine-driver.ts";

// The labels scenarios, against the engine: the same boundaries, and the same order of labels at each.
const file = parseScenarioFile(scenariosJson);

for (const scenario of file.scenarios) {
  const result = await replayScenario(scenario, graphLayoutLabelsBridge, () => labelsDriver());
  assert.equal(result.status, "passed", `${scenario.id}: ${JSON.stringify(result)}`);
  console.log(`ok ${scenario.id}`);
}

console.log(`${file.scenarios.length} scenarios, the engine's labels like the spec`);
