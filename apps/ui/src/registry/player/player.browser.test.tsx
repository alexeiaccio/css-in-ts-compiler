import { afterEach, describe, expect, it } from "vite-plus/test";

import { type MountedPlayer, PLAYER_DURATION, mountPlayer } from "./player.fixture";

// @cssints/headless checks `createPlayer` against specs/apg/player.qnt and the ported scenarios. This file is the skin's
// oracle: it mounts the starter in a real Chromium and drives the controls a reader does, through the demo's fake adapter.
// Nothing plays a real file: the adapter announces 1:30 and ticks its own clock.

/** Solid applies setters on the next flush; the primitive loads in `onSettled`, one frame later. */
const settle = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));

/** Polls until `done` holds, so the adapter's 200 ms clock is waited for rather than assumed. */
const waitFor = async (done: () => boolean, limit = 4000): Promise<void> => {
  const start = performance.now();
  while (!done()) {
    if (performance.now() - start > limit) {
      throw new Error("waitFor timed out");
    }
    await settle();
  }
};

const live: MountedPlayer[] = [];

const mounted = (): MountedPlayer => {
  const instance = mountPlayer();
  live.push(instance);
  return instance;
};

afterEach(() => {
  for (const instance of live.splice(0)) {
    instance.dispose();
  }
});

const part = <T extends HTMLElement>(root: ParentNode, name: string): T => {
  const element = root.querySelector<T>(`[data-part="${name}"]`);
  if (element === null) {
    throw new Error(`player: no ${name}`);
  }
  return element;
};

const surface = (root: ParentNode): HTMLElement => part(root, "player-surface");
const play = (root: ParentNode): HTMLButtonElement => part(root, "player-play");
const seek = (root: ParentNode): HTMLElement => part(root, "player-seek");
const time = (root: ParentNode): HTMLElement => part(root, "player-time");
const mute = (root: ParentNode): HTMLButtonElement => part(root, "player-mute");
const fill = (root: ParentNode): HTMLElement => part(root, "player-fill");

const value = (root: ParentNode): number => Number(seek(root).getAttribute("aria-valuenow"));

const click = async (element: HTMLElement): Promise<void> => {
  element.click();
  await settle();
};

/** A key on the focused control, as a reader's would arrive. */
const press = async (target: HTMLElement, key: string): Promise<void> => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  await settle();
};

describe("Player", () => {
  it("is a named group whose surface holds the caller's video frame", async () => {
    const { root } = mounted();
    await settle();

    expect(surface(root).getAttribute("role")).toBe("group");
    expect(surface(root).getAttribute("aria-label")).toBe("A short film about the coast");
    // the primitive's own surface props: the stage is its tab stop and takes its keys
    expect(surface(root).tabIndex).toBe(0);

    const media = part<HTMLVideoElement>(root, "player-media");
    expect(media.tagName).toBe("VIDEO");
    expect(media.getAttribute("src")).toBe("demo/coast-at-dusk.mp4");
    // the adapter decodes; the element is the picture frame, not a second player
    expect(media.getAttribute("preload")).toBe("none");
    expect(media.hasAttribute("controls")).toBe(false);
  });

  it("shows the duration the adapter announced in m:ss, and the slider's value text follows", async () => {
    const { root } = mounted();
    await settle();

    expect(seek(root).getAttribute("aria-valuemax")).toBe(String(PLAYER_DURATION));
    expect(seek(root).getAttribute("aria-valuetext")).toBe("0:00");
    expect(time(root).textContent).toBe("0:00 / 1:30");

    await press(seek(root), "End");
    expect(time(root).textContent).toBe("1:30 / 1:30");
    expect(seek(root).getAttribute("aria-valuetext")).toBe("1:30");

    await press(seek(root), "ArrowLeft");
    expect(time(root).textContent).toBe("1:29 / 1:30");
  });

  it("names the play button from the primitive's stage", async () => {
    const { root } = mounted();
    await settle();

    expect(play(root).getAttribute("aria-label")).toBe("Play");
    await click(play(root));
    expect(play(root).getAttribute("aria-label")).toBe("Pause");
    await click(play(root));
    expect(play(root).getAttribute("aria-label")).toBe("Play");
  });

  it("is the primitive's seek slider, and every key commits to the adapter", async () => {
    const { root, adapter } = mounted();
    await settle();

    expect(seek(root).getAttribute("role")).toBe("slider");
    expect(seek(root).getAttribute("aria-label")).toBe("Seek");
    expect(seek(root).getAttribute("aria-valuemin")).toBe("0");
    expect(seek(root).tabIndex).toBe(0);

    await press(seek(root), "ArrowRight");
    expect(value(root)).toBe(1);
    await press(seek(root), "PageUp");
    expect(value(root)).toBe(16);
    await press(seek(root), "PageDown");
    expect(value(root)).toBe(1);
    await press(seek(root), "Home");
    expect(value(root)).toBe(0);
    await press(seek(root), "End");
    expect(value(root)).toBe(PLAYER_DURATION);

    expect(adapter.seeks).toEqual([1, 16, 1, 0, PLAYER_DURATION]);
  });

  it("advances the slider, the time and the fill from the adapter's clock, and a press on the rail seeks", async () => {
    const { root, adapter } = mounted();
    await settle();

    expect(value(root)).toBe(0);
    expect(fill(root).style.width).toBe("0%");

    await click(play(root));
    await waitFor(() => value(root) >= 1);
    expect(value(root)).toBeGreaterThanOrEqual(1);
    expect(time(root).textContent).not.toBe("0:00 / 1:30");
    expect(parseFloat(fill(root).style.width)).toBeGreaterThan(0);
    expect(parseFloat(part(root, "player-thumb").style.left)).toBeGreaterThan(0);

    // a press in the middle of the rail seeks to the middle of the film
    const box = seek(root).getBoundingClientRect();
    seek(root).dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: box.left + box.width / 2,
        bubbles: true,
        cancelable: true,
      }),
    );
    await settle();
    expect(Math.abs(value(root) - PLAYER_DURATION / 2)).toBeLessThanOrEqual(1);
    const committed = adapter.seeks.at(-1) ?? 0;
    expect(Math.abs(committed - PLAYER_DURATION / 2)).toBeLessThanOrEqual(1);

    await click(play(root));
    expect(play(root).getAttribute("aria-label")).toBe("Play");
  });

  it("paints mute from the primitive's pressed state, and the surface takes the rest of the keys", async () => {
    const { root } = mounted();
    await settle();

    expect(mute(root).getAttribute("aria-pressed")).toBe("false");
    await click(mute(root));
    expect(mute(root).getAttribute("aria-pressed")).toBe("true");

    // the surface's own keys: the arrows seek five seconds and Space plays
    await press(surface(root), "m");
    expect(mute(root).getAttribute("aria-pressed")).toBe("false");
    await press(surface(root), "ArrowRight");
    expect(value(root)).toBe(5);
    await press(surface(root), " ");
    expect(play(root).getAttribute("aria-label")).toBe("Pause");
    await click(play(root));
    expect(play(root).getAttribute("aria-label")).toBe("Play");
  });
});
