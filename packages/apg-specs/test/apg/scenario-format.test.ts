import {
  EXTENDED_STEP_FIELDS,
  type Scenario,
  Unsupported,
  parseScenarioFile,
  replayScenario,
} from "../../src/scenario";
import { describe, expect, it } from "vite-plus/test";
import { readFileSync, readdirSync } from "node:fs";
import parts from "../../scenarios/parts.json";

const scenariosDir = new URL("../../scenarios/apg/", import.meta.url);
const names = readdirSync(scenariosDir)
  .filter((name) => name.endsWith(".json"))
  .sort();
const read = (name: string): Record<string, unknown> =>
  JSON.parse(readFileSync(new URL(name, scenariosDir), "utf8"));

const NAME = "[A-Za-z][A-Za-z0-9-]*";
const INDEX = "\\d+";
const PATH = `${INDEX}(?:/${INDEX})*`;
const TARGET = new RegExp(
  `^${NAME}(?::(?:${PATH},${INDEX}|${PATH}|${NAME}))?(?:/${NAME}(?::${INDEX})?)*$`,
);
const IDREF = new Set([
  "aria-controls",
  "aria-labelledby",
  "aria-describedby",
  "aria-activedescendant",
  "aria-owns",
  "aria-details",
  "aria-errormessage",
  "aria-flowto",
]);
const CORE = ["event", "target", "key", "text", "prop", "value", "repeat", "ms"];
const STEP_FIELDS = new Set<string>([...CORE, ...EXTENDED_STEP_FIELDS]);
const EXPECT_KEYS = new Set(["focus", "attrs", "visible", "hidden", "value", "events", "checked"]);

const partNamesOf = (target: string): ReadonlyArray<string> =>
  target
    .split("/")
    .filter((segment, index) => index === 0 || /^[A-Za-z]/.test(segment))
    .map((segment) => segment.replace(/:.*$/, ""))
    .filter((segment) => segment !== "child");

interface RawStep {
  readonly target?: string;
  readonly expect?: {
    readonly focus?: string | null;
    readonly attrs?: Record<string, Record<string, unknown>>;
    readonly visible?: string[];
    readonly hidden?: string[];
    readonly checked?: string | null;
  };
  readonly [key: string]: unknown;
}

describe("scenario format v2 (every file in scenarios/apg)", () => {
  it("decodes and keeps no field outside the documented vocabulary", () => {
    expect(names.length).toBeGreaterThanOrEqual(69);
    for (const name of names) {
      const raw = read(name);
      expect(() => parseScenarioFile(raw as never), name).not.toThrow();
      expect(Array.isArray(raw["skipped"]), `${name} skipped`).toBe(true);
      for (const entry of raw["skipped"] as unknown[]) {
        expect(typeof entry, `${name} skipped entry`).toBe("object");
        expect(
          Object.keys(entry as object).every((k) =>
            ["id", "upstream", "upstreamTest", "reason"].includes(k),
          ),
          `${name} skipped keys`,
        ).toBe(true);
        expect(typeof (entry as { reason: unknown }).reason).toBe("string");
      }
      for (const scenario of raw["scenarios"] as Array<{
        id: string;
        steps: RawStep[];
      }>) {
        for (const step of scenario.steps) {
          const where = `${scenario.id}`;
          if ("event" in step) {
            expect("expect" in step, `${where} fused step`).toBe(false);
            for (const key of Object.keys(step)) {
              expect(STEP_FIELDS.has(key), `${where}: step field ${key}`).toBe(true);
            }
          } else {
            expect(Object.keys(step), where).toEqual(["expect"]);
            for (const key of Object.keys(step.expect ?? {})) {
              expect(EXPECT_KEYS.has(key), `${where}: expect.${key}`).toBe(true);
            }
          }
        }
      }
    }
  });

  it("writes every target in the grammar and every part name in the table", () => {
    const table = parts as Record<
      string,
      {
        specs: string[];
        parts: Record<string, string | null>;
        fixture: string[] | "*";
      }
    >;
    for (const name of names) {
      const raw = read(name);
      const pattern = raw["pattern"] as string;
      const entry = table[pattern];
      expect(entry, `${name}: pattern ${pattern} in parts.json`).toBeDefined();
      const known = (part: string): boolean =>
        entry === undefined ||
        entry.fixture === "*" ||
        part in entry.parts ||
        entry.fixture.includes(part);
      const targets: Array<[string, string]> = [];
      for (const scenario of raw["scenarios"] as Array<{
        id: string;
        steps: RawStep[];
      }>) {
        for (const step of scenario.steps) {
          const add = (t: unknown): void => {
            if (typeof t === "string") {
              targets.push([scenario.id, t]);
            }
          };
          add(step.target);
          const e = step.expect;
          if (e === undefined) {
            continue;
          }
          add(e.focus);
          add(e.checked);
          (e.visible ?? []).forEach(add);
          (e.hidden ?? []).forEach(add);
          for (const [target, attrs] of Object.entries(e.attrs ?? {})) {
            add(target);
            for (const [attr, value] of Object.entries(attrs)) {
              expect(
                value === null || typeof value === "string",
                `${scenario.id}: attrs value of ${attr}`,
              ).toBe(true);
              if (
                IDREF.has(attr) &&
                typeof value === "string" &&
                value.split(/\s+/).every((ref) => ref.includes(":") && TARGET.test(ref))
              ) {
                for (const ref of value.split(/\s+/)) {
                  targets.push([scenario.id, ref]);
                }
              }
            }
          }
        }
      }
      for (const [id, target] of targets) {
        expect(TARGET.test(target), `${id}: target "${target}"`).toBe(true);
        for (const part of partNamesOf(target)) {
          expect(known(part), `${id}: part "${part}" of "${target}"`).toBe(true);
        }
      }
    }
  });

  it("keeps parts.json and the README table in step", () => {
    const readme = readFileSync(new URL("README.md", scenariosDir), "utf8")
      .split("## Part names")
      .at(-1) as string;
    for (const [pattern, entry] of Object.entries(
      parts as Record<string, { parts: Record<string, string | null> }>,
    )) {
      const row = readme.split("\n").find((line) => line.startsWith(`| \`${pattern}\``));
      expect(row, `README row for ${pattern}`).toBeDefined();
      for (const [scenarioName, specName] of Object.entries(entry.parts)) {
        expect(row, `${pattern}.${scenarioName}`).toContain(`\`${scenarioName}\``);
        if (specName !== null && specName !== scenarioName) {
          expect(row, `${pattern}.${scenarioName}`).toContain(`← spec \`${specName}\``);
        }
      }
    }
  });
});

describe("scenario decoding", () => {
  const file = (steps: unknown[]) =>
    parseScenarioFile({
      pattern: "p",
      source: "apg",
      scenarios: [{ id: "p.apg.x", steps }],
    } as never);
  const stepsOf = (steps: unknown[]) => file(steps).scenarios[0]?.steps ?? [];
  const noop = {
    setup: () => [],
    event: () => [],
  };
  const replay = (scenario: Scenario, stepFields?: ReadonlyArray<never>) =>
    replayScenario(
      scenario,
      { ...noop, ...(stepFields === undefined ? {} : { stepFields }) },
      () => ({
        perform: () => undefined,
        observer: {
          focus: () => null,
          attr: () => null,
          visible: () => [],
          events: () => [],
        },
      }),
    );

  it("round-trips every typed step field", () => {
    const step = {
      event: "pointerdown",
      target: "track",
      key: "a",
      text: "t",
      prop: "p",
      value: { a: 1 },
      set: { open: true },
      repeat: 4,
      ms: 5,
      position: 0.25,
      modifiers: ["Control", "Shift"],
      phase: "up",
      button: 2,
      buttons: 1,
      pointerType: "touch",
      pointerId: 7,
      detail: 1,
      count: 2,
      canceled: true,
      defaultPrevented: false,
      isComposing: true,
      inputEvent: "paste",
    };
    expect(stepsOf([step])[0]).toEqual(step);
  });

  it("round-trips the typed expectation keys", () => {
    const expectation = {
      focus: "tab:1",
      attrs: { "tab:1": { "aria-controls": "tabpanel:1", hidden: null } },
      visible: ["tabpanel:1"],
      hidden: ["tabpanel:0"],
      checked: "radio:0",
      value: 1,
      events: { onChange: [1] },
    };
    expect(stepsOf([{ expect: expectation }])[0]).toEqual({
      expect: expectation,
    });
  });

  it("keeps an unknown step field and marks the scenario unsupported", async () => {
    const [step] = stepsOf([{ event: "click", target: "a", swirl: 3 }]);
    expect(step).toMatchObject({ swirl: 3 });
    const scenario = file([{ event: "click", swirl: 3 }]).scenarios[0];
    expect(scenario).toBeDefined();
    await expect(replay(scenario as Scenario)).resolves.toEqual({
      status: "unsupported",
      reason: 'step field "swirl"',
    });
  });

  it("marks a typed extended field unsupported until the bridge opts in", async () => {
    const scenario = file([{ event: "key", key: "a", modifiers: ["Shift"] }])
      .scenarios[0] as Scenario;
    await expect(replay(scenario)).resolves.toMatchObject({
      status: "unsupported",
      reason: 'step field "modifiers"',
    });
    await expect(replay(scenario, ["modifiers"] as never)).resolves.toMatchObject({
      status: "passed",
    });
  });

  it("never drops the action of a step that also carries expect", async () => {
    const scenario = file([{ event: "click", target: "a", expect: { focus: "a" } }])
      .scenarios[0] as Scenario;
    await expect(replay(scenario)).resolves.toMatchObject({
      status: "unsupported",
      reason: 'step field "expect"',
    });
  });

  it("rejects a typed field with a wrong value instead of stripping it", () => {
    expect(() => stepsOf([{ event: "key", modifiers: ["Shiftt"] }])).toThrow();
    expect(() => stepsOf([{ event: "key", phase: "keydown" }])).toThrow();
  });

  it("keeps unknown expectation keys and reports them as skipped", async () => {
    const scenario = file([{ expect: { swirl: 1, hidden: ["a"] } }]).scenarios[0] as Scenario;
    const result = await replay(scenario);
    expect(result).toEqual({
      status: "passed",
      skipped: [
        "hidden: expectation not supported by the replay engine",
        "swirl: expectation not supported by the replay engine",
      ],
    });
  });

  it("exports Unsupported for bridges", () => {
    expect(new Unsupported("x")).toBeInstanceOf(Error);
  });
});
