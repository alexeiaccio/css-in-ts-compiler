// A palette has no spec (it is a composition, not a pattern), so this drives the kit's own DOM rather than a scenario:
// read a part, press a key, type in the field, run a row. The kit's part names are the only contract it shares with the
// component.
import type { CommandPalette as Palette } from "@cssints/headless";
import { flush } from "solid-js";
import { userEvent } from "vite-plus/test/browser";
import type { MountedPalette } from "./command-palette.fixture.tsx";

const byPart = <T extends HTMLElement = HTMLElement>(name: string): T => {
  const element = document.querySelector<T>(`[data-part="${name}"]`);
  if (element === null) {
    throw new Error(`the palette has no ${name}`);
  }
  return element;
};

/** The primitive the fixture handed back, or a failure: the mount did not render. */
export const paletteOf = (mounted: MountedPalette): Palette => {
  const palette = mounted.palette();
  if (palette === undefined) {
    throw new Error("the palette did not render");
  }
  return palette;
};

/** The layer, while the palette is open; `null` when it is closed and out of the DOM. */
export const layerOf = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-part="command-palette-layer"]');

export const panelOf = (): HTMLElement => byPart("command-palette");

export const inputOf = (): HTMLInputElement => byPart<HTMLInputElement>("command-palette-input");

export const listOf = (): HTMLElement => byPart("command-palette-list");

/** The trigger's props come from the skin, not the primitive: it is the element with `aria-haspopup`. */
export const triggerOf = (mounted: MountedPalette): HTMLElement => {
  const trigger = mounted.root.querySelector<HTMLElement>('[aria-haspopup="dialog"]');
  if (trigger === null) {
    throw new Error("the palette has no trigger");
  }
  return trigger;
};

/** The rows, in the order the primitive's results put them. */
export const rowsOf = (): HTMLElement[] => [
  ...document.querySelectorAll<HTMLElement>('[data-part="command-palette-item"]'),
];

/** What the list shows, as the labels a reader reads: the primitive's results, rendered by the skin. */
export const visibleLabels = (): string[] => rowsOf().map((row) => row.textContent ?? "");

export const activeId = (): string | null => inputOf().getAttribute("aria-activedescendant");

/** A press on the field (or the panel), as a keyboard does it. */
export const press = (
  target: Element,
  key: string,
  init: KeyboardEventInit = {},
): KeyboardEvent => {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  flush();
  return event;
};

/** Real typing in the field, replacing what is there; then a flush, so the list is read after Solid applied it. */
export const type = async (text: string): Promise<void> => {
  const input = inputOf();
  input.focus();
  input.select();
  await userEvent.keyboard(text);
  flush();
};

/** Opens the palette from its trigger, which is what a page does. */
export const open = async (mounted: MountedPalette): Promise<void> => {
  await userEvent.click(triggerOf(mounted));
  flush();
};

/** Opens the palette through the primitive, for a host that binds its own chord. */
export const openThrough = (mounted: MountedPalette): void => {
  paletteOf(mounted).openPalette();
  flush();
};

/** Runs the row with this label with the pointer. */
export const clickRow = async (label: string): Promise<void> => {
  const row = rowsOf().find((candidate) => candidate.textContent === label);
  if (row === undefined) {
    throw new Error(`the list has no row ${label}`);
  }
  await userEvent.click(row);
  flush();
};
