import { type ScenarioConfig, differentialWalk, specDriver } from "@cssints/apg-specs/scenario";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import {
  playerBridge,
  playerConfig,
  playerProbe,
  playerSteps,
} from "@cssints/apg-specs/apg/player.bridge";
import definitionJson from "@cssints/apg-specs/apg/player.model.json";
import { domDriver } from "./dom-driver";
import { mountPlayer } from "./player.fixture";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  domDriver(mountPlayer(playerConfig(config)), { hideableParts: [] });

// the adapter loads in `onMount`; wait for it before reading
const flush = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));

describe("createPlayer x spec (differential walk)", () => {
  // uncontrolled, then a controlled host that accepts every request and one that rejects them
  for (const config of [
    { duration: 90 },
    { duration: 1 },
    { duration: 90, controlled: true, accepts: true },
    { duration: 90, controlled: true, accepts: false },
  ] as const) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: playerSteps,
        probe: playerProbe,
        makePair: () => Promise.resolve([specDriver(model, playerBridge, config), dom(config)]),
        runs: 10,
        steps: 20,
        seed: 7,
      });
    });
  }
});

describe("createPlayer controlled preferences (real DOM)", () => {
  it("a host that ignores the requests keeps every preference untouched", async () => {
    const driver = dom({ duration: 90, controlled: true, accepts: false });
    await flush();
    await driver.perform({ event: "prop", prop: "toggleMute" });
    await driver.perform({ event: "prop", prop: "toggleFullscreen" });
    await driver.perform({ event: "prop", prop: "setVolume", value: 25 });
    await driver.perform({ event: "prop", prop: "setRate", value: 150 });
    expect(driver.observer.attr("mute", "aria-pressed")).toBe("false");
    expect(driver.observer.attr("fullscreen", "aria-pressed")).toBe("false");
    expect(driver.observer.attr("volume", "aria-valuenow")).toBe("100");
    expect(driver.observer.attr("rate", "aria-valuenow")).toBe("100");
    expect(driver.observer.events("onMutedChange")).toEqual([true]);
    expect(driver.observer.events("onFullscreenChange")).toEqual([true]);
    expect(driver.observer.events("onVolumeChange")).toEqual([25]);
    expect(driver.observer.events("onRateChange")).toEqual([150]);
    // the host writing the props is the only thing that commits
    await driver.perform({ event: "prop", prop: "propMuted", value: true });
    await driver.perform({ event: "prop", prop: "propVolume", value: 75 });
    expect(driver.observer.attr("mute", "aria-pressed")).toBe("true");
    expect(driver.observer.attr("volume", "aria-valuenow")).toBe("75");
    expect(driver.observer.events("onMutedChange")).toEqual([true]);
    driver.dispose?.();
  });

  it("a host that accepts commits each request through the prop", async () => {
    const driver = dom({ duration: 90, controlled: true, accepts: true });
    await flush();
    await driver.perform({ event: "prop", prop: "toggleMute" });
    await driver.perform({ event: "prop", prop: "setRate", value: 150 });
    expect(driver.observer.attr("mute", "aria-pressed")).toBe("true");
    expect(driver.observer.attr("rate", "aria-valuenow")).toBe("150");
    driver.dispose?.();
  });
});

describe("createPlayer (real DOM)", () => {
  it("metadata exposes the duration and the m:ss value text", async () => {
    const driver = dom({ duration: 90 });
    await flush();
    expect(driver.observer.attr("seek", "aria-valuemax")).toBe("90");
    expect(driver.observer.attr("seek", "aria-valuetext")).toBe("0:00");
    await driver.perform({ event: "key", key: "PageUp", target: "seek" });
    expect(driver.observer.attr("seek", "aria-valuenow")).toBe("15");
    expect(driver.observer.attr("seek", "aria-valuetext")).toBe("0:15");
    driver.dispose?.();
  });

  it("Space on the surface toggles play/pause and the button label", async () => {
    const driver = dom({ duration: 90 });
    await flush();
    expect(driver.observer.attr("play", "aria-label")).toBe("Play");
    await driver.perform({ event: "key", key: "Space", target: "surface" });
    expect(driver.observer.attr("play", "aria-label")).toBe("Pause");
    await driver.perform({ event: "key", key: "Space", target: "surface" });
    expect(driver.observer.attr("play", "aria-label")).toBe("Play");
    driver.dispose?.();
  });

  it("the seek thumb keys move ±1/±15 and jump Home/End", async () => {
    const driver = dom({ duration: 90 });
    await flush();
    await driver.perform({ event: "key", key: "End", target: "seek" });
    expect(driver.observer.attr("seek", "aria-valuenow")).toBe("90");
    await driver.perform({ event: "key", key: "ArrowLeft", target: "seek" });
    expect(driver.observer.attr("seek", "aria-valuenow")).toBe("89");
    await driver.perform({ event: "key", key: "PageDown", target: "seek" });
    expect(driver.observer.attr("seek", "aria-valuenow")).toBe("74");
    await driver.perform({ event: "key", key: "Home", target: "seek" });
    expect(driver.observer.attr("seek", "aria-valuenow")).toBe("0");
    driver.dispose?.();
  });

  it("mute and fullscreen reflect their pressed state", async () => {
    const driver = dom({ duration: 90 });
    await flush();
    expect(driver.observer.attr("mute", "aria-pressed")).toBe("false");
    expect(driver.observer.attr("fullscreen", "aria-pressed")).toBe("false");
    await driver.perform({ event: "prop", prop: "toggleMute" });
    await driver.perform({ event: "prop", prop: "toggleFullscreen" });
    expect(driver.observer.attr("mute", "aria-pressed")).toBe("true");
    expect(driver.observer.attr("fullscreen", "aria-pressed")).toBe("true");
    driver.dispose?.();
  });
});
