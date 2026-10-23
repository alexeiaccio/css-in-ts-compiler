import { type QuintModelValue, decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import camera from "../../scenarios/canvas/camera.excalidraw.json";
import cameraJson from "../../src/canvas/camera.model.generated.json";
import marquee from "../../scenarios/canvas/marquee.excalidraw.json";
import pan from "../../scenarios/canvas/pan.excalidraw.json";

// The ported Excalidraw scenarios (MIT; the NOTICE is in scenarios/canvas/README.md) are
// data for the tracer. Here they are checked for envelope shape and replayed
// against the SAME definitions the specs use: marquee contain / overlap and the
// fixed-point centre-on. No tldraw material is allowed.

const files = [camera, marquee, pan];

interface Node {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

describe("canvas scenarios (envelope)", () => {
  it("every file carries the upstream pin, licence and copyright; ids are unique", () => {
    const ids = new Set<string>();
    for (const file of files) {
      expect(file.source).toBe("excalidraw");
      expect(file.license).toBe("MIT");
      expect(file.copyright).toBe("Copyright (c) 2020 Excalidraw");
      expect(file.commit).toMatch(/^[0-9a-f]{40}$/);
      for (const scenario of file.scenarios) {
        expect(scenario.id.startsWith(`${file.pattern}.${file.source}.`)).toBe(true);
        expect(scenario.upstream).toContain(`/blob/${file.commit}/`);
        expect(scenario.upstream).toContain("github.com/excalidraw/excalidraw");
        expect(scenario.upstreamTest.length).toBeGreaterThan(10);
        expect(scenario.notes.length).toBeGreaterThan(20);
        expect(ids.has(scenario.id)).toBe(false);
        ids.add(scenario.id);
      }
    }
    expect(JSON.stringify(files).toLowerCase()).not.toContain("tldraw");
  });
});

interface MarqueeStep {
  readonly event?: string;
  readonly at?: readonly number[];
  readonly shift?: boolean;
  readonly expect?: {
    readonly selection?: readonly string[];
    readonly selectionChanged?: boolean;
  };
}

const hits = (
  mode: string,
  rect: readonly [number, number, number, number],
  nodes: readonly Node[],
) =>
  nodes.flatMap((node) => {
    const [x0, y0, x1, y1] = rect;
    const selected =
      mode === "contain"
        ? x0 <= node.x && node.x + node.w <= x1 && y0 <= node.y && node.y + node.h <= y1
        : x0 < node.x + node.w && node.x < x1 && y0 < node.y + node.h && node.y < y1;
    return selected ? [node.id] : [];
  });

const same = (a: readonly string[], b: readonly string[]) =>
  [...a].sort().join() === [...b].sort().join();

describe("marquee scenarios replay against the contain | overlap definitions", () => {
  for (const scenario of marquee.scenarios) {
    it(scenario.id, () => {
      const { boxSelection, camera: cam, nodes } = scenario.config;
      const toWorld = (at: readonly number[]) => [
        (at[0] ?? 0) / cam.zoom - cam.x,
        (at[1] ?? 0) / cam.zoom - cam.y,
      ];
      let selection: string[] = [];
      let base: string[] = [];
      let shift = false;
      let origin: readonly number[] | undefined;
      let changed = false;
      let checked = 0;
      for (const step of scenario.steps as readonly MarqueeStep[]) {
        const before = selection;
        if (step.event === "modifier") {
          shift = step.shift === true;
        } else if (step.event === "pointerdown") {
          origin = toWorld(step.at ?? []);
          base = shift ? selection : [];
          selection = base;
        } else if (step.event === "pointermove" && origin !== undefined) {
          const here = toWorld(step.at ?? []);
          const rect = [
            Math.min(origin[0] ?? 0, here[0] ?? 0),
            Math.min(origin[1] ?? 0, here[1] ?? 0),
            Math.max(origin[0] ?? 0, here[0] ?? 0),
            Math.max(origin[1] ?? 0, here[1] ?? 0),
          ] as const;
          selection = [...new Set([...base, ...hits(boxSelection, rect, nodes)])];
        } else if (step.event === "pointerup") {
          origin = undefined;
        }
        if (step.event !== undefined) {
          changed = !same(before, selection);
        }
        if (step.expect?.selection !== undefined) {
          expect(same(selection, step.expect.selection)).toBe(true);
          checked += 1;
        }
        if (step.expect?.selectionChanged !== undefined) {
          expect(changed).toBe(step.expect.selectionChanged);
        }
      }
      expect(checked).toBeGreaterThan(0);
    });
  }

  it("the same drag selects a subset in contain mode of what overlap selects", () => {
    const [contain, overlap] = [
      marquee.scenarios.find((s) => s.id.endsWith("contain-partial-overlap-selects-nothing")),
      marquee.scenarios.find((s) => s.id.endsWith("overlap-partial-selects")),
    ];
    const drag = (steps: readonly object[] | undefined) =>
      (steps ?? []).filter((step) => "event" in step);
    expect(drag(contain?.steps)).toEqual(drag(overlap?.steps));
    expect(contain?.config.nodes).toEqual(overlap?.config.nodes);
    const picked = (steps: readonly MarqueeStep[] | undefined) =>
      steps?.flatMap((step) => step.expect?.selection ?? []) ?? [];
    const inOverlap = picked(overlap?.steps as readonly MarqueeStep[]);
    expect(
      picked(contain?.steps as readonly MarqueeStep[]).every((id) => inOverlap.includes(id)),
    ).toBe(true);
    expect(contain?.config.boxSelection).toBe("contain");
    expect(overlap?.config.boxSelection).toBe("overlap");
  });
});

describe("pan scenario: the drag threshold is a screen distance", () => {
  it("5 px is still a click, 6 px engages (Euclidean, strictly greater)", () => {
    const scenario = pan.scenarios[0];
    const threshold = scenario?.config.dragThresholdPx ?? 0;
    const down = [100, 100];
    const away = (at: readonly number[]) =>
      ((at[0] ?? 0) - (down[0] ?? 0)) ** 2 + ((at[1] ?? 0) - (down[1] ?? 0)) ** 2 > threshold ** 2;
    const moves = (scenario?.steps ?? []).flatMap((step) =>
      "event" in step && step.event === "pointermove" ? [step.at ?? []] : [],
    );
    expect(moves.map(away)).toEqual([false, true, true]);
  });
});

describe("camera scenarios replay against the camera fixed point", () => {
  const model = makeReferenceModel(decodeDefinition(cameraJson));
  const holds = (state: QuintModelValue, expression: unknown) => {
    const doc = structuredClone(cameraJson) as typeof cameraJson;
    (doc.defs as Record<string, unknown>)["Probe"] = {
      kind: "invariant",
      params: [],
      body: expression,
    };
    const probed = makeReferenceModel(decodeDefinition(doc));
    return probed.invariants.find((invariant) => invariant.name === "Probe")?.holds(state);
  };
  const int = (value: number) => ({ kind: "int", value: String(value) });
  const app = (opcode: string, ...args: unknown[]) => ({
    kind: "app",
    opcode,
    args,
  });

  it("centre-target-keeps-zoom: scroll = viewport / 2 / zoom - centre, exactly", () => {
    const scenario = camera.scenarios[0];
    const expected = scenario?.steps.find((step) => "expect" in step);
    const want = (expected as { expect: { camera: { x: number; y: number; zoom: number } } }).expect
      .camera;
    // fixed point: zoom * 4096, t * 256; centre-on is clampT(rdiv(w / 2 * TZ, z) - P * TONE)
    const zoom = want.zoom * 4096;
    const centre = 1025;
    const tx = app(
      "clampT",
      app(
        "isub",
        app("rdiv", app("imul", int(50), { kind: "name", name: "TZ" }), int(zoom)),
        app("imul", int(centre), { kind: "name", name: "TONE" }),
      ),
    );
    expect(holds(model.initial, app("eq", tx, int(want.x * 256)))).toBe(true);
    expect(want.x).toBe(100 / 2 / want.zoom - centre);
  });
});
