import { describe, expect, it } from "vite-plus/test";
import { createControllable } from "../src/controllable";

describe("createControllable (request vs commit)", () => {
  it("uncontrolled: a request commits at once and calls onChange", () => {
    const calls: boolean[] = [];
    const [value, request] = createControllable<boolean>({
      value: () => undefined,
      initial: false,
      onChange: () => (next) => calls.push(next),
    });
    request(true);
    expect(value()).toBe(true);
    request(true);
    expect(calls).toEqual([true]);
  });

  it("controlled: a host that answers in the same task takes the same request again", () => {
    // The guard is one gesture, one intent: a press and the focus it causes
    // ask once. It may not outlive the value the request was made from. A host
    // that commits inside the gesture — a "select all" that reads its
    // children, or the native frame loop, which runs one gesture after another
    // in one task and no microtask between them — moves that value, and the
    // same request after it is the user's again.
    let host: "true" | "false" | "mixed" = "false";
    const requested: Array<"true" | "false" | "mixed"> = [];
    const [value, request] = createControllable<"true" | "false" | "mixed">({
      value: () => host,
      initial: "false",
      onChange: () => (next) => {
        requested.push(next);
        host = next;
      },
    });
    request("true"); // the host commits inside the click
    expect(value()).toBe("true");
    host = "mixed"; // another control moved the value back out
    expect(value()).toBe("mixed");
    request("true"); // the same request, still the user's
    expect([host, requested]).toEqual(["true", ["true", "true"]]);
  });

  it("controlled: a request only calls onChange; the value prop is the commit", () => {
    const calls: boolean[] = [];
    const [value, request] = createControllable<boolean>({
      value: () => false,
      initial: false,
      onChange: () => (next) => calls.push(next),
    });
    request(true);
    expect(value()).toBe(false);
    expect(calls).toEqual([true]);
  });
});
