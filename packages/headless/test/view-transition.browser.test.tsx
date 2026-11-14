import {
  type ScenarioConfig,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { createRoot } from "solid-js";
import { describe, expect, it } from "vite-plus/test";
import { createViewTransition } from "../src/view-transition";
import {
  viewTransitionBridge,
  viewTransitionConfig,
  viewTransitionProbe,
  viewTransitionSteps,
} from "@cssints/apg-specs/patterns/view-transition.bridge";
import scenarios from "@cssints/apg-specs/scenarios/patterns/view-transition.spec.json";
import definitionJson from "@cssints/apg-specs/patterns/view-transition.model.json";
import { mountViewTransition } from "./view-transition.fixture";
import { viewTransitionDriver } from "./view-transition.driver";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  viewTransitionDriver(mountViewTransition(viewTransitionConfig(config)));

describe("createViewTransition x scenarios (real DOM)", () => {
  const file = parseScenarioFile(scenarios);
  describe(file.source, () => {
    for (const scenario of file.scenarios) {
      it(scenario.id, async (context) => {
        const result = await replayScenario(scenario, viewTransitionBridge, dom);
        if (result.status === "unsupported") {
          context.skip(result.reason);
        }
      });
    }
  });
});

describe("createViewTransition x spec (differential walk)", () => {
  for (const config of [{}, { motion: "reduce" }]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: viewTransitionSteps,
        probe: viewTransitionProbe,
        makePair: () =>
          Promise.resolve([specDriver(model, viewTransitionBridge, config), dom(config)]),
        runs: 6,
        steps: 20,
        seed: 41,
      });
    });
  }
});

interface StartViewTransitionHost {
  startViewTransition?: (update: () => void | Promise<void>) => {
    readonly ready?: Promise<void>;
    readonly finished: Promise<void>;
  };
}

/** Run `body` with no `startViewTransition` anywhere on document (SSR, old browser). */
const withoutApi = async (body: () => Promise<void>): Promise<void> => {
  const proto = Document.prototype as unknown as StartViewTransitionHost;
  const had = Object.hasOwn(proto, "startViewTransition");
  const saved = proto.startViewTransition;
  if (had) {
    Reflect.deleteProperty(proto, "startViewTransition");
  }
  try {
    await body();
  } finally {
    if (had && saved !== undefined) {
      Object.defineProperty(proto, "startViewTransition", {
        value: saved,
        writable: true,
        configurable: true,
      });
    }
  }
};

/** Run `body` with the global API replaced, then take the stub off the document. */
const withApi = async (
  stub: NonNullable<StartViewTransitionHost["startViewTransition"]>,
  body: () => Promise<void>,
): Promise<void> => {
  const host = document as unknown as StartViewTransitionHost;
  host.startViewTransition = stub;
  try {
    await body();
  } finally {
    Reflect.deleteProperty(host, "startViewTransition");
  }
};

describe("createViewTransition real paths", () => {
  it("runs the update when the API is absent", async () => {
    await withoutApi(async () => {
      const viewTransition = createRoot(() => createViewTransition({}));
      expect(viewTransition.supported()).toBe(false);
      let updates = 0;
      await viewTransition.run(() => {
        updates += 1;
      });
      expect(updates).toBe(1);
      expect(viewTransition.state()).toEqual({ supported: false, active: false });
    });
  });

  it("runs the update without starting a transition under reduced motion", async () => {
    let starts = 0;
    await withApi(
      (update) => {
        starts += 1;
        void update();
        return { finished: Promise.resolve() };
      },
      async () => {
        const viewTransition = createRoot(() =>
          createViewTransition({ prefs: { motion: "reduce" } }),
        );
        let updates = 0;
        await viewTransition.run(() => {
          updates += 1;
        });
        expect(updates).toBe(1);
        expect(starts).toBe(0);
        expect(viewTransition.state().active).toBe(false);
      },
    );
  });

  it("resolves run when ready rejects, applying the update once", async () => {
    await withApi(
      (update) => {
        void update();
        const ready = Promise.reject(new Error("duplicate view-transition-name"));
        void ready.catch(() => {});
        return { ready, finished: Promise.reject(new Error("skipped")) };
      },
      async () => {
        const viewTransition = createRoot(() => createViewTransition({}));
        let updates = 0;
        await expect(
          viewTransition.run(() => {
            updates += 1;
          }),
        ).resolves.toBeUndefined();
        expect(updates).toBe(1);
        expect(viewTransition.state()).toEqual({ supported: true, active: false });
      },
    );
  });
});

describe("createViewTransition style objects", () => {
  it("persist names the element match-element, with no class by default", () => {
    const viewTransition = createRoot(() => createViewTransition({}));
    expect(viewTransition.persist()).toEqual({
      style: { "view-transition-name": "match-element" },
    });
  });

  it("persist and name carry the class hook when asked", () => {
    const viewTransition = createRoot(() => createViewTransition({}));
    expect(viewTransition.persist({ class: "card" }).style["view-transition-class"]).toBe("card");
    expect(viewTransition.name("a", { class: "card" }).style["view-transition-class"]).toBe("card");
  });

  it("name is deterministic, prefixed, and near ids do not collide", () => {
    const viewTransition = createRoot(() => createViewTransition({}));
    expect(viewTransition.name("a").style["view-transition-name"]).toBe("vt-a");
    expect(viewTransition.name("a").style["view-transition-name"]).toBe(
      viewTransition.name("a").style["view-transition-name"],
    );
    expect(viewTransition.name("a-b").style["view-transition-name"]).toBe("vt-a-b");
    expect(viewTransition.name("a-b").style["view-transition-name"]).not.toBe(
      viewTransition.name("a").style["view-transition-name"],
    );
  });

  it("takes the prefix from the options", () => {
    const viewTransition = createRoot(() => createViewTransition({ prefix: "v" }));
    expect(viewTransition.name("a").style["view-transition-name"]).toBe("v-a");
  });
});
