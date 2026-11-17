/// <reference types="vite-plus/client" />
import {
  IGNORED_CONFIG_KEYS,
  type ScenarioConfig,
  type SpecBridge,
  Unsupported,
} from "../../src/scenario";
import { describe, expect, it } from "vite-plus/test";
import { checkboxBridge } from "../../src/apg/checkbox.bridge";
import { checkboxGroupBridge } from "../../src/apg/checkbox-group.bridge";
import { sliderBridge } from "../../src/apg/slider.bridge";
import { sliderMultithumbBridge } from "../../src/apg/slider-multithumb.bridge";
import { spinbuttonBridge } from "../../src/apg/spinbutton.bridge";
import { switchBridge } from "../../src/apg/switch.bridge";

// The sink keys a scenario may carry: config the model cannot observe, so a
// normaliser accepts it and drops it before the bridge sees it. The marker
// (`true`) is what a JSON scenario carries; the fixture attaches the spy.
describe("ignored config keys", () => {
  it("carries the marker scenarios use", () => {
    expect(IGNORED_CONFIG_KEYS.has("feedback")).toBe(true);
  });

  // The six normalisers #209 taught about `feedback` one by one. Each bridge
  // mounts the same events with a sink key as without it (setup is what turns a
  // config into model steps, so equal steps are the same run) and keeps the
  // guard for a key it does not know.
  const BRIDGES: ReadonlyArray<readonly [string, SpecBridge, ScenarioConfig]> = [
    ["slider", sliderBridge, {}],
    ["slider-multithumb", sliderMultithumbBridge, {}],
    ["spinbutton", spinbuttonBridge, {}],
    ["switch", switchBridge, {}],
    ["checkbox", checkboxBridge, {}],
    ["checkbox-group", checkboxGroupBridge, { group: true }],
  ];

  for (const [name, bridge, base] of BRIDGES) {
    it(`${name}: mounts the same steps with a sink key`, () => {
      const steps = bridge.setup(base);
      for (const key of IGNORED_CONFIG_KEYS) {
        expect(bridge.setup({ ...base, [key]: true }), key).toEqual(steps);
      }
    });

    it(`${name}: still rejects a key it does not know`, () => {
      const unknown = (): ReadonlyArray<unknown> => bridge.setup({ ...base, nonsense: 1 });
      expect(unknown).toThrow(Unsupported);
      expect(unknown).toThrow(/nonsense/);
    });
  }
});

// Every bridge, discovered from the source tree so a new one is covered without
// a table to update. A normaliser that special-cases a rejection instead of
// routing it through `checkUnknownConfigKey` rejects the sink key here.
describe("every bridge consults the ignored-key list", () => {
  const modules = import.meta.glob<Record<string, unknown>>("../../src/**/*.bridge.ts", {
    eager: true,
  });

  const bridges = Object.entries(modules).flatMap(([path, module]) =>
    Object.entries(module)
      .filter(([exportName, value]) => {
        const bridge = value as Partial<SpecBridge> | undefined;
        return exportName.endsWith("Bridge") && typeof bridge?.setup === "function";
      })
      .map(([exportName, value]) => [`${path} ${exportName}`, value as SpecBridge] as const),
  );

  it("finds the bridges", () => {
    expect(bridges.length).toBeGreaterThan(40);
  });

  it("accepts a config that carries each ignored key", () => {
    for (const [name, bridge] of bridges) {
      for (const key of IGNORED_CONFIG_KEYS) {
        let error: unknown;
        try {
          bridge.setup({ [key]: true });
        } catch (caught) {
          error = caught;
        }
        // Any other reason to skip is fine; rejecting the sink key is not.
        if (error !== undefined) {
          expect(error, name).toBeInstanceOf(Unsupported);
        }
        expect(error instanceof Unsupported ? error.message : "", name).not.toContain(
          `config ${key}=`,
        );
      }
    }
  });
});
