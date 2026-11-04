import { describe, expect, it } from "vite-plus/test";
import { TONE, ZMAX, ZMIN, ZONE, screenToWorld, worldToScreen } from "../src/canvas-math";

// The camera's two directions are inverses. Every zoom is a power of two within ZMIN .. ZMAX, so
// `zf` divides TZ and `screenToWorld` keeps the whole screen px; the round trip loses nothing.

describe("canvas-math x worldToScreen", () => {
  const cameras = [
    { name: "1x", t: 0, z: ZONE },
    { name: "zoomed in (8x)", t: 123 * TONE, z: ZMAX },
    { name: "zoomed out (1/16x)", t: -7 * TONE, z: ZMIN },
    { name: "negative translation", t: -321 * TONE, z: ZONE },
    { name: "2x, sub-unit translation", t: 77 * TONE + 128, z: 2 * ZONE },
  ] as const;

  for (const { name, t, z } of cameras) {
    it(`inverts screenToWorld at ${name}`, () => {
      for (const s of [0, 1, 2, 37, 123, 400, 799]) {
        expect(worldToScreen(screenToWorld(s, t, z), t, z)).toBe(s);
      }
    });
  }

  it("maps the known points exactly", () => {
    // 1x, no translation: one world unit (TONE) is one screen px.
    expect(screenToWorld(100, 0, ZONE)).toBe(100 * TONE);
    expect(worldToScreen(100 * TONE, 0, ZONE)).toBe(100);
    // 2x: 100 px is 50 world units.
    expect(screenToWorld(100, 0, 2 * ZONE)).toBe(50 * TONE);
    expect(worldToScreen(50 * TONE, 0, 2 * ZONE)).toBe(100);
    // Panned 10 world units at 1x, the world point 50 sits at screen 60.
    expect(worldToScreen(50 * TONE, 10 * TONE, ZONE)).toBe(60);
  });
});
