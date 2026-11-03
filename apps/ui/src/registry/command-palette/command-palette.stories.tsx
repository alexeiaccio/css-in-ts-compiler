// The command palette's stories: a composed example, because the item is four parts and the primitive rather than one
// component with props. The commands record what ran, and the trigger opens the dialog — the layer is portalled to the
// body, so the preview keeps only the button. The page's chord (`hotkey="mod+k"`) is left unbound here: a preview must not
// take a shortcut away from the site it sits in.
import type { PaletteCommand } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import { createSignal } from "solid-js";

import type { Meta, Story } from "@cssints/stories";
import {
  CommandPalette,
  CommandPaletteContent,
  CommandPaletteTrigger,
} from "./command-palette.tsx";

const COMMANDS: ReadonlyArray<Omit<PaletteCommand, "run">> = [
  { id: "deploy", label: "Deploy", group: "Ship", keywords: ["release", "production"] },
  { id: "rollback", label: "Roll back", group: "Ship" },
  { id: "theme", label: "Toggle theme", group: "View", keywords: ["dark", "light"] },
  { id: "settings", label: "Open settings", group: "View", keywords: ["preferences"] },
];

const meta = { title: "Command palette" } satisfies Meta;
export default meta;

export const Default: Story = {
  render: (): JSX.Element => {
    const [log, setLog] = createSignal("Nothing has run yet.");
    const commands = COMMANDS.map((command) => ({
      ...command,
      run: () => {
        setLog(`Ran “${command.label}”.`);
      },
    }));
    return (
      <div class="demo-column">
        <CommandPalette commands={commands} hotkey={false}>
          <CommandPaletteTrigger>Open the palette</CommandPaletteTrigger>
          <CommandPaletteContent />
        </CommandPalette>
        <p class="demo-text">
          Type to filter, ↑ and ↓ to move the highlight, Enter to run a command, Escape to close.
        </p>
        <p class="demo-text">{log()}</p>
      </div>
    );
  },
};
