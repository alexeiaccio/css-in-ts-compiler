import type { CommandPalette as Palette, PaletteCommand } from "@cssints/headless";
import { render } from "@solidjs/web";
import {
  CommandPalette,
  CommandPaletteContent,
  CommandPaletteTrigger,
} from "./command-palette.tsx";

/** What a mount hands the driver: the host ancestor, the palette itself, and the commands that ran. */
export interface MountedPalette {
  /** The element the palette was rendered into, which may be a transformed, clipped ancestor. */
  readonly root: HTMLElement;
  /** The commands that ran, by id, in order. */
  readonly chosen: ReadonlyArray<string>;
  readonly palette: () => Palette | undefined;
  readonly dispose: () => void;
}

export interface PaletteFixtureConfig {
  /** A `transform` and an `overflow: hidden` around the palette: the case the portal exists for. */
  readonly hostile?: boolean;
  /** The chord the palette binds on the page; `false` binds none. */
  readonly hotkey?: string | false;
  /** The host's own modal root, when it has one. */
  readonly mount?: Element;
}

const makeCommands = (chosen: string[]): ReadonlyArray<PaletteCommand> => [
  {
    id: "deploy",
    label: "Deploy",
    group: "Ship",
    keywords: ["release", "production"],
    run: () => {
      chosen.push("deploy");
    },
  },
  {
    id: "rollback",
    label: "Roll back",
    group: "Ship",
    run: () => {
      chosen.push("rollback");
    },
  },
  {
    id: "theme",
    label: "Toggle theme",
    group: "View",
    keywords: ["dark", "light"],
    run: () => {
      chosen.push("theme");
    },
  },
  {
    id: "settings",
    label: "Open settings",
    group: "View",
    keywords: ["preferences"],
    run: () => {
      chosen.push("settings");
    },
  },
];

/**
 * Mounts the styled palette the way a page does: a trigger button inside an optional transformed, clipped ancestor, and the
 * layer the part portals away. The host owns no open state — the primitive does, as the skin exposes it — so this records
 * the commands that ran and hands the primitive over for the assertions that need `results()` or `optionProps()`.
 *
 * @param {PaletteFixtureConfig} config the ancestor and the chord
 * @returns {MountedPalette} the mounted element and the driver's view of it
 */
export const mountPalette = (config: PaletteFixtureConfig = {}): MountedPalette => {
  const root = document.createElement("div");
  document.body.append(root);
  const chosen: string[] = [];
  let palette: Palette | undefined;
  const dispose = render(
    () => (
      <div
        data-part="palette-host"
        style={
          config.hostile === true
            ? { transform: "translateZ(0)", overflow: "hidden", height: "80px" }
            : undefined
        }
      >
        <CommandPalette
          commands={makeCommands(chosen)}
          hotkey={config.hotkey ?? false}
          mount={config.mount}
          onReady={(created) => {
            palette = created;
          }}
        >
          <CommandPaletteTrigger>Open the palette</CommandPaletteTrigger>
          <CommandPaletteContent />
        </CommandPalette>
      </div>
    ),
    root,
  );
  return {
    root,
    chosen,
    palette: () => palette,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
