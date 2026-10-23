/**
 * Emit SCXML from a generated model document.
 *
 *     tsx scripts/emit-scxml.ts <model.generated.json> [out.scxml] [--state-vars=a,b,c]
 *
 * Without `--state-vars` the chart is the faithful one-state form (one state,
 * one transition per event). With them, every reachable configuration of those
 * variables becomes a state, which reads as a statechart; the other variables
 * still update. A view of the machine, not a second source of truth: the spec
 * stays in Quint, the invariants stay in the spec.
 */
import { decodeDefinition, toScxml } from "@quint-machine/core";
import { readFileSync, writeFileSync } from "node:fs";

const [input, output, ...flags] = process.argv.slice(2);
if (input === undefined) {
  throw new Error("usage: emit-scxml <model.generated.json> [out.scxml] [--state-vars=a,b,c]");
}

const stateVarsFlag = flags.find((flag) => flag.startsWith("--state-vars="));
const stateVars =
  stateVarsFlag === undefined
    ? undefined
    : stateVarsFlag
        .slice("--state-vars=".length)
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name.length > 0);

const document = decodeDefinition(JSON.parse(readFileSync(input, "utf8")));
const scxml = toScxml(document, stateVars === undefined ? {} : { stateVars });

if (output === undefined) {
  process.stdout.write(scxml);
} else {
  writeFileSync(output, scxml);
  const states = stateVars === undefined ? 1 : (scxml.match(/<state id=/g) ?? []).length;
  process.stderr.write(
    `${document.module}: ${document.step.length} events, ${states} state(s) -> ${output}\n`,
  );
}
