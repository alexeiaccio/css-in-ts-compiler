import {
  type ScenarioConfig,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import {
  dropzoneBridge,
  dropzoneConfig,
  dropzoneProbe,
  dropzoneSteps,
} from "@cssints/apg-specs/patterns/dropzone.bridge";
import apg from "@cssints/apg-specs/scenarios/patterns/dropzone.spec.json";
import definitionJson from "@cssints/apg-specs/patterns/dropzone.model.json";
import { DROPZONE_MAX_FILES, DROPZONE_MAX_SIZE, mountDropZone } from "./dropzone.fixture";
import { dropzoneDriver } from "./dropzone.driver";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) => {
  const c = dropzoneConfig(config);
  return dropzoneDriver(mountDropZone(c), c);
};

describe("createDropZone x scenarios (real DOM)", () => {
  const file = parseScenarioFile(apg);
  describe(file.source, () => {
    for (const scenario of file.scenarios) {
      it(scenario.id, async (context) => {
        const result = await replayScenario(scenario, dropzoneBridge, dom);
        if (result.status === "unsupported") {
          context.skip(result.reason);
        }
      });
    }
  });
});

describe("createDropZone x spec (differential walk)", () => {
  for (const config of [{}, { disabled: true }]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: dropzoneSteps,
        probe: dropzoneProbe,
        makePair: () => Promise.resolve([specDriver(model, dropzoneBridge, config), dom(config)]),
        runs: 8,
        steps: 25,
        seed: 31,
      });
    });
  }
});

// The pure part the machine deliberately leaves out: the per-file decision
// (`accept`, `maxSize`, `maxFiles`) is a function of one batch. A deterministic
// LCG builds batches of "a file that fits", "a wrong type" and "an oversized
// image", and the summary `deliver` reports must add up.
describe("createDropZone x spec (the per-file decision)", () => {
  const UINT32 = 0x1_0000_0000;
  const rand = (seed: number): (() => number) => {
    let state = seed >>> 0;
    return () => {
      state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
      return state / UINT32;
    };
  };

  const fileOf = (kind: "ok" | "text" | "big", index: number): File =>
    kind === "ok"
      ? new File([new Uint8Array(8)], `ok-${index}.png`, { type: "image/png" })
      : kind === "text"
        ? new File([new Uint8Array(8)], `notes-${index}.txt`, { type: "text/plain" })
        : new File([new Uint8Array(DROPZONE_MAX_SIZE + 1)], `big-${index}.png`, {
            type: "image/png",
          });

  const transferOf = (files: readonly File[]): DataTransfer => {
    const transfer = new DataTransfer();
    for (const file of files) {
      transfer.items.add(file);
    }
    return transfer;
  };

  const tick = () => new Promise((resolve) => setTimeout(resolve, 20));

  const dropFiles = async (mounted: ReturnType<typeof mountDropZone>, files: readonly File[]) => {
    mounted.root.querySelector('[data-part="zone"]')!.dispatchEvent(
      new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
        dataTransfer: transferOf(files),
      }),
    );
    await tick();
    const accepted = (mounted.events.get("onFiles") ?? []).flatMap(
      (payload) => payload as string[],
    );
    const rejected = (mounted.events.get("onReject") ?? []) as ReadonlyArray<[string, string]>;
    return { accepted, rejected };
  };

  it("accounts for every file once, and accepts at most maxFiles", async () => {
    const random = rand(17);
    const kinds = ["ok", "text", "big"] as const;
    for (let batch = 0; batch < 12; batch += 1) {
      const files = Array.from({ length: Math.floor(random() * 6) }, (_, index) =>
        fileOf(kinds[Math.floor(random() * kinds.length)] ?? "ok", index),
      );
      const mounted = mountDropZone({ disabled: false });
      try {
        const { accepted, rejected } = await dropFiles(mounted, files);
        const where = files.map((file) => file.name).join(", ");

        // every file is accounted for exactly once
        expect(accepted.length + rejected.length, where).toBe(files.length);
        const seen = [...accepted, ...rejected.map(([name]) => name)];
        expect(new Set(seen).size, where).toBe(files.length);

        // the summary is bounded by the rules the fixture passes
        expect(accepted.length, where).toBeLessThanOrEqual(DROPZONE_MAX_FILES);

        // each refused file has exactly one reason, and the reason is the rule it broke
        const fitting = files.filter((file) => file.name.startsWith("ok-")).map((f) => f.name);
        const expectedAccepted = fitting.slice(0, DROPZONE_MAX_FILES);
        expect(accepted, where).toEqual(expectedAccepted);
        for (const [name, reason] of rejected) {
          const expectedReason = name.startsWith("notes-")
            ? "type"
            : name.startsWith("big-")
              ? "size"
              : "count";
          expect(reason, `${where}: ${name}`).toBe(expectedReason);
        }
        // a file that fits every rule is refused only past maxFiles, and then for the count
        expect(
          rejected.filter(([name]) => name.startsWith("ok-")).map(([name]) => name),
          where,
        ).toEqual(fitting.slice(DROPZONE_MAX_FILES));
      } finally {
        mounted.dispose();
      }
    }
  });

  it("never refuses a batch that fits every rule", async () => {
    const mounted = mountDropZone({ disabled: false });
    try {
      const files = [fileOf("ok", 0), fileOf("ok", 1)];
      const { accepted, rejected } = await dropFiles(mounted, files);
      expect(accepted).toEqual(files.map((file) => file.name));
      expect(rejected).toEqual([]);
    } finally {
      mounted.dispose();
    }
  });
});
