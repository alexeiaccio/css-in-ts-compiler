import {
  type QuintModelValue,
  decodeDefinition,
  makeReferenceModel,
  violatedInvariants,
} from "@quint-machine/core";
import {
  assertReachable,
  explore,
  simulate,
  stateKey,
  verifySpec,
} from "@quint-machine/core/testing";
import { describe, expect, it } from "vite-plus/test";
import definitionJson from "../../src/apg/player.model.generated.json";

// Spec-only verification for specs/apg/player.qnt: the media player, composed
// from the APG Slider seek contract and the HTML HTMLMediaElement playback
// machine. No scenario bridge yet — the ported scenarios land with the headless
// primitive (its `player.bridge.ts`).

const definition = decodeDefinition(definitionJson);
const model = makeReferenceModel(definition);
const initial = model.initial;

const step = (state: QuintModelValue, event: Record<string, unknown>): QuintModelValue => {
  const next = model.transition(state, event);
  expect(violatedInvariants(model, next)).toEqual([]);
  return next;
};

// loading → ready with a known duration
const ready = (d: bigint): QuintModelValue => step(initial, { _tag: "onLoadedMetadata", d });
const playing = (d: bigint): QuintModelValue => step(ready(d), { _tag: "play" });

describe("apg player (spec-only)", () => {
  it("declares every invariant the spec owns", () => {
    expect(model.invariants.map((invariant) => invariant.name)).toEqual([
      "SeekInRange",
      "AriaNowWithinBounds",
      "PlayingNotPaused",
      "PlayingNotEnded",
      "PausedMirrorsStage",
      "EndedMirrorsStage",
      "ValueTextMirrors",
      "ValueTextWellFormed",
      "MutedSilences",
      "VolumeInRange",
      "SeekingOnlyWhenKnown",
      "EndedAtDuration",
      "RateAllowed",
      "FocusKnown",
      "CallbacksNonNegative",
      "ControlledFollowsProps",
      "RejectedRequestUntouched",
      "AcceptedRequestCommits",
    ]);
  });

  it("invariants have teeth on hand-built bad states", () => {
    // aria-valuenow above aria-valuemax (text kept consistent, so only the range)
    expect(
      violatedInvariants(model, {
        ...initial,
        known: true,
        dur: 90n,
        pos: 100n,
        textMin: 1n,
        textSec: 40n,
      }),
    ).toEqual(["SeekInRange", "AriaNowWithinBounds"]);
    // a playing stage with a paused mirror
    expect(violatedInvariants(model, { ...initial, stage: "playing", paused: true })).toEqual([
      "PlayingNotPaused",
      "PausedMirrorsStage",
    ]);
    // a seconds component outside 0..59 (the mirror is coupled to pos, so both fall)
    expect(violatedInvariants(model, { ...initial, textSec: 60n })).toEqual([
      "ValueTextMirrors",
      "ValueTextWellFormed",
    ]);
    // muted but audible
    expect(violatedInvariants(model, { ...initial, muted: true, applied: 50n })).toEqual([
      "MutedSilences",
    ]);
    // seeking before the duration is known
    expect(violatedInvariants(model, { ...initial, seeking: true, known: false })).toEqual([
      "SeekingOnlyWhenKnown",
    ]);
    // an event committed a preference while controlled (the props were left behind)
    expect(
      violatedInvariants(model, {
        ...initial,
        controlled: true,
        prefs: 0n,
        muted: true,
        applied: 0n,
      }),
    ).toEqual(["ControlledFollowsProps"]);
    // a rejected request that moved a preference anyway
    expect(
      violatedInvariants(model, {
        ...initial,
        outcome: "rejected",
        base: 0n,
      }),
    ).toEqual(["RejectedRequestUntouched"]);
    // an accepted volume request that did not commit its intent
    expect(
      violatedInvariants(model, {
        ...initial,
        outcome: "accepted",
        reqKind: "volume",
        askNum: 40n,
      }),
    ).toEqual(["AcceptedRequestCommits"]);
    // ended somewhere other than the timeline end
    expect(
      violatedInvariants(model, {
        ...initial,
        ended: true,
        pos: 5n,
        known: true,
        dur: 9n,
        textMin: 0n,
        textSec: 5n,
      }),
    ).toEqual(["EndedMirrorsStage", "EndedAtDuration"]);
  });

  it("starts loading, paused, unstarted, at full volume", () => {
    expect(initial).toMatchObject({
      stage: "loading",
      seeking: false,
      pos: 0n,
      dur: 0n,
      known: false,
      paused: true,
      ended: false,
      vol: 100n,
      applied: 100n,
      muted: false,
      rate: 100n,
      full: false,
      textMin: 0n,
      textSec: 0n,
      focus: "none",
      plays: 0n,
      pauses: 0n,
      seeks: 0n,
      controlled: false,
      accepting: false,
      reqs: 0n,
      reqKind: "none",
      outcome: "none",
    });
  });

  it("metadata makes the duration known; canplay only advances the stage", () => {
    const loaded = ready(90n);
    expect(loaded).toMatchObject({
      stage: "ready",
      known: true,
      dur: 90n,
      pos: 0n,
      paused: true,
    });
    // a second metadata event while not loading is a no-op
    expect(step(loaded, { _tag: "onLoadedMetadata", d: 5n })).toEqual(loaded);
    expect(step(initial, { _tag: "onCanPlay" })).toMatchObject({
      stage: "ready",
      known: false,
    });
  });

  it("plays, buffers, resumes, ticks the clock and ends at the duration", () => {
    const p = playing(90n);
    expect(p).toMatchObject({
      stage: "playing",
      paused: false,
      ended: false,
      plays: 1n,
    });
    const buffering = step(p, { _tag: "onWaiting" });
    expect(buffering).toMatchObject({ stage: "buffering", paused: false });
    const resumed = step(buffering, { _tag: "onPlaying" });
    expect(resumed).toMatchObject({ stage: "playing", paused: false });
    const ticked = step(resumed, { _tag: "onTimeUpdate", t: 30n });
    expect(ticked).toMatchObject({
      pos: 30n,
      textMin: 0n,
      textSec: 30n,
    });
    const ended = step(ticked, { _tag: "onEnded" });
    expect(ended).toMatchObject({
      stage: "ended",
      ended: true,
      paused: true,
      pos: 90n,
      textMin: 1n,
      textSec: 30n,
    });
    // seeking out of the end leaves the ended stage (HTML clears .ended)
    expect(step(ended, { _tag: "seekCommit", t: 0n })).toMatchObject({
      stage: "paused",
      ended: false,
      pos: 0n,
    });
    // play from the end snaps back to the start
    const restarted = step(ended, { _tag: "play" });
    expect(restarted).toMatchObject({
      stage: "playing",
      ended: false,
      pos: 0n,
      textMin: 0n,
      textSec: 0n,
      plays: 2n,
    });
  });

  it("togglePlay pauses while active and counts the callbacks", () => {
    const paused = step(playing(90n), { _tag: "togglePlay" });
    expect(paused).toMatchObject({
      stage: "paused",
      paused: true,
      pauses: 1n,
      plays: 1n,
    });
    const resumed = step(paused, { _tag: "togglePlay" });
    expect(resumed).toMatchObject({ stage: "playing", plays: 2n });
  });

  it("a seek is ignored until the duration is known", () => {
    const next = step(initial, { _tag: "seekCommit", t: 30n });
    expect(next).toEqual(initial);
  });

  it("commit seeks, preview seeks without committing, seeked clears", () => {
    const committed = step(ready(90n), { _tag: "seekCommit", t: 30n });
    expect(committed).toMatchObject({
      pos: 30n,
      seeking: true,
      seeks: 1n,
      textMin: 0n,
      textSec: 30n,
    });
    expect(step(committed, { _tag: "onSeeked" })).toMatchObject({
      seeking: false,
      pos: 30n,
    });
    const previewed = step(ready(90n), { _tag: "seekPreview", t: 59n });
    expect(previewed).toMatchObject({ pos: 59n, seeking: true, seeks: 0n });
  });

  it("the thumb keys move ±1/±15 and jump Home/End once focused", () => {
    const focused = step(ready(90n), { _tag: "focusOn", target: "seek" });
    expect(step(focused, { _tag: "seekKey", key: "ArrowRight" })).toMatchObject({
      pos: 1n,
      seeks: 1n,
    });
    expect(step(focused, { _tag: "seekKey", key: "End" })).toMatchObject({
      pos: 90n,
    });
    expect(step(focused, { _tag: "seekKey", key: "PageDown" })).toMatchObject({
      pos: 0n,
    });
    // unfocused, the thumb keys are inert
    expect(step(ready(90n), { _tag: "seekKey", key: "End" })).toMatchObject({
      pos: 0n,
    });
  });

  it("scopes the surface keys (ArrowLeft/Right = ±5) to the surface", () => {
    const surface = step(step(ready(90n), { _tag: "seekCommit", t: 30n }), {
      _tag: "focusOn",
      target: "surface",
    });
    expect(step(surface, { _tag: "surfaceSeekKey", key: "ArrowRight" })).toMatchObject({
      pos: 35n,
      seeks: 2n,
    });
    expect(step(surface, { _tag: "surfaceSeekKey", key: "ArrowLeft" })).toMatchObject({ pos: 25n });
    // on the seek thumb or a toolbar control, the surface keys do nothing
    const control = step(surface, { _tag: "focusOn", target: "control" });
    expect(step(control, { _tag: "surfaceSeekKey", key: "ArrowRight" })).toEqual(control);
  });

  it("mute silences the applied gain and unmute restores it", () => {
    const quieter = step(ready(90n), { _tag: "setVolume", v: 40n });
    expect(quieter).toMatchObject({ vol: 40n, applied: 40n, muted: false });
    const muted = step(quieter, { _tag: "toggleMute" });
    expect(muted).toMatchObject({ muted: true, applied: 0n, vol: 40n });
    expect(step(muted, { _tag: "toggleMute" })).toMatchObject({
      muted: false,
      applied: 40n,
    });
  });

  it("sets the speed from the menu and toggles fullscreen", () => {
    expect(step(ready(90n), { _tag: "setRate", r: 150n })).toMatchObject({
      rate: 150n,
    });
    expect(step(ready(90n), { _tag: "toggleFullscreen" })).toMatchObject({
      full: true,
    });
  });

  it("uncontrolled, every preference request is accepted and fires its callback", () => {
    const muted = step(ready(90n), { _tag: "toggleMute" });
    expect(muted).toMatchObject({
      muted: true,
      outcome: "accepted",
      reqKind: "muted",
      askNum: 1n,
      reqs: 1n,
    });
    // a redundant volume / rate request is not a request
    expect(step(muted, { _tag: "setVolume", v: 100n })).toEqual(muted);
    expect(step(muted, { _tag: "setRate", r: 100n })).toEqual(muted);
    // the host-side events are inert without controlled props
    expect(step(muted, { _tag: "propMuted", m: false })).toEqual(muted);
  });

  it("controlled, a request the host ignores leaves every preference untouched", () => {
    const host = step(ready(90n), { _tag: "control" });
    expect(host).toMatchObject({ controlled: true });
    const cases: ReadonlyArray<[Record<string, unknown>, string, bigint]> = [
      [{ _tag: "setVolume", v: 25n }, "volume", 25n],
      [{ _tag: "toggleMute" }, "muted", 1n],
      [{ _tag: "setRate", r: 150n }, "rate", 150n],
      [{ _tag: "toggleFullscreen" }, "fullscreen", 1n],
    ];
    for (const [event, kind, ask] of cases) {
      const rejected = step(host, event);
      expect(rejected).toMatchObject({
        vol: 100n,
        applied: 100n,
        muted: false,
        rate: 100n,
        full: false,
        prefs: host["prefs"],
        outcome: "rejected",
        reqKind: kind,
        askNum: ask,
        reqs: 1n,
      });
    }
  });

  it("controlled, only the host props commit a preference", () => {
    const host = step(ready(90n), { _tag: "control" });
    expect(step(host, { _tag: "propVolume", v: 50n })).toMatchObject({
      vol: 50n,
      applied: 50n,
      outcome: "none",
      reqs: 0n,
    });
    const muted = step(host, { _tag: "propMuted", m: true });
    expect(muted).toMatchObject({ muted: true, applied: 0n });
    expect(step(muted, { _tag: "propRate", r: 200n })).toMatchObject({
      rate: 200n,
      muted: true,
    });
    expect(step(host, { _tag: "propFullscreen", f: true })).toMatchObject({
      full: true,
    });
  });

  it("controlled, a host that accepts commits the intent through the props", () => {
    const host = step(step(ready(90n), { _tag: "control" }), {
      _tag: "acceptRequests",
    });
    const muted = step(host, { _tag: "toggleMute" });
    expect(muted).toMatchObject({
      muted: true,
      applied: 0n,
      outcome: "accepted",
      reqs: 1n,
    });
    expect(step(muted, { _tag: "setVolume", v: 25n })).toMatchObject({
      vol: 25n,
      muted: true,
      applied: 0n,
      outcome: "accepted",
      reqKind: "volume",
    });
  });

  it("error stops playback; loadStart resets to loading", () => {
    const errored = step(playing(90n), { _tag: "onError" });
    expect(errored).toMatchObject({
      stage: "error",
      paused: true,
      ended: false,
      seeking: false,
    });
    expect(step(errored, { _tag: "loadStart" })).toMatchObject({
      stage: "loading",
      known: false,
      dur: 0n,
      pos: 0n,
      paused: true,
    });
  });

  it("every state reaches playing, no invariant is violated", () => {
    const report = explore(model, { maxDepth: 6, maxStates: 40_000 });
    expect(report.violations).toEqual([]);
    const distinct = new Set(report.states.map((state) => stateKey(model, state)));
    expect(distinct.size).toBeGreaterThan(50);
    assertReachable(report, "a playing state", (state) => state["stage"] === "playing");
    assertReachable(report, "an ended state", (state) => state["ended"] === true);
  });

  it("survives long random walks and the shared verifier", () => {
    const report = simulate(model, { runs: 50, maxSteps: 60, seed: 7 });
    expect(report.violations).toEqual([]);
    verifySpec(model, {
      maxDepth: 4,
      maxStates: 8_000,
      runs: 20,
      maxSteps: 40,
    });
  });
});
