import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import {
  cameraBridge,
  cameraConfig,
  cameraProbe,
  cameraSteps,
  pointerBridge,
  pointerConfig,
  pointerProbe,
  pointerSteps,
} from "@cssints/apg-specs/canvas/canvas.bridge";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import cameraContract from "@cssints/apg-specs/scenarios/canvas/camera.contract.json";
import cameraExcalidraw from "@cssints/apg-specs/scenarios/canvas/camera.excalidraw.json";
import cameraJson from "@cssints/apg-specs/canvas/camera.model.json";
import { canvasDriver } from "./canvas.driver";
import { createCanvas } from "../src";
import { createRoot } from "solid-js";
import marqueeExcalidraw from "@cssints/apg-specs/scenarios/canvas/marquee.excalidraw.json";
import { mountCanvas } from "./canvas.fixture";
import panExcalidraw from "@cssints/apg-specs/scenarios/canvas/pan.excalidraw.json";
import pointerContract from "@cssints/apg-specs/scenarios/canvas/pointer.contract.json";
import pointerJson from "@cssints/apg-specs/canvas/pointer.model.json";

const cameraModel = makeReferenceModel(decodeDefinition(cameraJson));
const pointerModel = makeReferenceModel(decodeDefinition(pointerJson));

const cameraDom = (config: ScenarioConfig) =>
  canvasDriver(mountCanvas({ kind: "camera", ...cameraConfig(config) }), {
    kind: "camera",
  });
const pointerDom = (config: ScenarioConfig) =>
  canvasDriver(mountCanvas({ kind: "pointer", ...pointerConfig(config) }), {
    kind: "pointer",
  });

// Scenarios whose expectations the primitive deliberately does not meet. Each entry must still
// fail on the DOM (so fixing the gap forces removing it) and says why. None today: every contract
// scenario is authored from the specs, and the DOM and the model agree on all of them.
const DIVERGENCES: Readonly<Record<string, string>> = {};

// The ported Excalidraw scenarios carry their own node sets, cameras and a pixel-position step
// vocabulary (`at`, `goal`) that the spec's fixed three-node palette cannot replay, so the bridge
// rejects them as `Unsupported` on every target. They are replayed by the spec-only tests.
const OUT_OF_VOCABULARY =
  "carries its own nodes / camera / viewport (config) and pixel positions (steps); the models use a fixed three-node pool";

describe("createCanvas x contract scenarios (spec model and real DOM)", () => {
  const suites = [
    {
      name: "camera",
      file: parseScenarioFile(cameraContract),
      bridge: cameraBridge,
      model: cameraModel,
      dom: cameraDom,
    },
    {
      name: "pointer",
      file: parseScenarioFile(pointerContract),
      bridge: pointerBridge,
      model: pointerModel,
      dom: pointerDom,
    },
  ] as const;
  for (const { name, file, bridge, model, dom } of suites) {
    describe(name, () => {
      for (const scenario of file.scenarios) {
        it(`${scenario.id} (model)`, async () => {
          const result = await replayScenario(scenario, bridge, (config) =>
            specDriver(model, bridge, config),
          );
          expect(result).toEqual({ status: "passed", skipped: [] });
        });
        it(`${scenario.id} (DOM)`, async (context) => {
          const run = replayScenario(scenario, bridge, dom);
          const divergence = DIVERGENCES[scenario.id];
          if (divergence !== undefined) {
            await expect(run).rejects.toBeInstanceOf(ScenarioMismatch);
            return;
          }
          const result = await run;
          if (result.status === "unsupported") {
            context.skip(result.reason);
          }
          expect(result).toEqual({ status: "passed", skipped: [] });
        });
      }
    });
  }
});

describe("ported Excalidraw scenarios stay out of vocabulary", () => {
  const sources = [
    ["camera", cameraExcalidraw, cameraBridge],
    ["marquee", marqueeExcalidraw, pointerBridge],
    ["pan", panExcalidraw, pointerBridge],
  ] as const;
  for (const [area, source, bridge] of sources) {
    for (const scenario of parseScenarioFile(source).scenarios) {
      it(`${scenario.id}: ${OUT_OF_VOCABULARY.slice(0, 22)}...`, async () => {
        const result = await replayScenario(scenario, bridge, () => {
          throw new Error(`${area}: must not mount, the bridge gates it`);
        });
        expect(result.status).toBe("unsupported");
      });
    }
  }
});

describe("createCanvas x spec (differential walk)", () => {
  const cameraConfigs = [{}, { reducedMotion: true }];
  for (const config of cameraConfigs) {
    it(`camera matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: cameraSteps,
        probe: cameraProbe,
        makePair: () =>
          Promise.resolve([specDriver(cameraModel, cameraBridge, config), cameraDom(config)]),
        runs: 20,
        steps: 30,
        seed: 11,
      });
    });
  }
  const pointerConfigs = [{}, { marquee: "overlap" }, { snap: true }];
  for (const config of pointerConfigs) {
    it(`pointer matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: pointerSteps,
        probe: pointerProbe,
        makePair: () =>
          Promise.resolve([specDriver(pointerModel, pointerBridge, config), pointerDom(config)]),
        runs: 20,
        steps: 40,
        seed: 23,
      });
    });
  }
});

// One check per honoured pref: a primitive that ignores its `prefs` input fails here.
describe("createCanvas x prefs", () => {
  const nodes = [{ id: "far", x: 5000, y: 4000, width: 100, height: 80, label: "Far" }];

  it("focusFollowsCamera: false keeps the camera on an out-of-view focus", () => {
    const canvas = createRoot(() =>
      createCanvas({
        nodes,
        requestFrame: () => {},
        prefs: { focusFollowsCamera: false },
      }),
    );
    const before = canvas.peek().camera;
    canvas.nodeProps("far").onFocus();
    expect(canvas.peek().cursor).toBe("far");
    expect(canvas.peek().camera).toEqual(before);
    expect(canvas.peek().tweening).toBe(false);
  });

  it("announce: false keeps the counter but silences the live region", () => {
    const canvas = createRoot(() =>
      createCanvas({
        nodes,
        requestFrame: () => {},
        prefs: { announce: false },
      }),
    );
    canvas.nodeProps("far").onKeyDown(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(canvas.peek().selection).toEqual(["far"]);
    expect(canvas.peek().announcements).toBe(1);
    expect(canvas.peek().announcement).toBe("");
  });

  it("motion: reduce turns reduced motion on and jumps the camera", () => {
    const canvas = createRoot(() =>
      createCanvas({
        nodes,
        requestFrame: () => {},
        prefs: { motion: "reduce" },
      }),
    );
    expect(canvas.peek().reducedMotion).toBe(true);
    canvas.animateTo({ kind: "centre", x: 100, y: 100 });
    expect(canvas.peek().tweening).toBe(false);
    expect(canvas.peek().camera.tx).not.toBe(0);
  });
});
