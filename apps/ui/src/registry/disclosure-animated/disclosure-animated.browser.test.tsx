import {
  type ScenarioConfig,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import {
  animationBridge,
  animationConfig,
  animationProbe,
  animationSteps,
} from "@cssints/apg-specs/patterns/animation.bridge";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, it } from "vite-plus/test";
import scenarios from "@cssints/apg-specs/scenarios/patterns/animation.spec.json";
import definitionJson from "@cssints/apg-specs/patterns/animation.model.json";
import { domDriver } from "./disclosure-animated-driver.ts";
import { mountDisclosureAnimated } from "./disclosure-animated.fixture";

// The component's conformance is the animation spec: `specs/patterns/animation.qnt` is the protocol, its 15 scenarios
// replay through this DOM, and a differential walk compares the generated model with the component after every step.
// The model's `progress` is a five-point sample of an arbitrary frame; the driver pins the frame by advancing the paused
// animation exactly one point, so the value probe compares the same grid the model does.
const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) => domDriver(mountDisclosureAnimated(animationConfig(config)));

describe("DisclosureAnimated x the animation spec (real DOM)", () => {
  const file = parseScenarioFile(scenarios);
  for (const scenario of file.scenarios) {
    it(scenario.id, async (context) => {
      const result = await replayScenario(scenario, animationBridge, dom);
      if (result.status === "unsupported") {
        context.skip(result.reason);
      }
    });
  }
});

describe("DisclosureAnimated x the animation spec (differential walk)", () => {
  // Both configs are driveable: the preference is a mount prop, and the fake clock is the machine's. A config the driver
  // could not drive would be `Unsupported` here, with the reason, rather than silently compared against a different widget.
  const CONFIGS: ReadonlyArray<ScenarioConfig> = [
    { reducedMotion: false },
    { reducedMotion: true },
  ];
  for (const config of CONFIGS) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: animationSteps,
        probe: animationProbe,
        makePair: () => Promise.resolve([specDriver(model, animationBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});
