// The shortcuts' stories: the sheet a page opens for `?`, built from the same chords its registry binds. The component
// renders the dialog; who opens it is the page's business.
import { createSignal } from "solid-js";
import type { JSX } from "@solidjs/web";
import type { Meta, Story } from "@cssints/stories";

import { Button } from "../button/button.tsx";
import { Shortcuts } from "./shortcuts.tsx";

const GROUPS = [
  {
    group: "Editing",
    items: [
      { keys: "mod+k", label: "Command palette" },
      { keys: "mod+s", label: "Save the note" },
      { keys: "mod+shift+z", label: "Redo" },
    ],
  },
  {
    group: "Moving around",
    items: [
      { keys: "g then i", label: "Go to the inbox" },
      { keys: "/", label: "Search" },
    ],
  },
  {
    group: "Help",
    items: [{ keys: "?", label: "Keyboard shortcuts" }],
  },
];

const meta = { title: "Shortcuts" } satisfies Meta;
export default meta;

export const Sheet: Story = {
  render: () => {
    const [open, setOpen] = createSignal(false);
    return (
      <div class="demo-column">
        <div class="demo-row">
          <Button onClick={() => setOpen(true)}>Keyboard shortcuts</Button>
        </div>
        <p class="demo-text">
          The sheet is a modal dialog: `mod` is ⌘ on a Mac and Ctrl elsewhere, and every chord is a chip.
        </p>
        <Shortcuts open={open()} onOpenChange={setOpen} groups={GROUPS} />
      </div>
    );
  },
};

// A window that is not a Mac: `mod` reads as Ctrl, and the caps show it.
export const Windows: Story = {
  render: () => {
    const [open, setOpen] = createSignal(false);
    return (
      <div class="demo-column">
        <Button onClick={() => setOpen(true)}>Keyboard shortcuts</Button>
        <Shortcuts open={open()} onOpenChange={setOpen} groups={GROUPS} isApple={false} />
      </div>
    );
  },
};
