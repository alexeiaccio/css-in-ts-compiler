// The scrollspy's stories: a table of contents beside a pane, the current heading following the pane's scroll. The pane is
// the scroll container the primitive watches, and the ring is an inset shadow so a heading scrolled to the top counts.
import { createSignal } from "solid-js";
import type { JSX } from "@solidjs/web";
import type { Meta, Story } from "@cssints/stories";

import { Scrollspy } from "./scrollspy.tsx";

const SECTIONS = [
  { id: "spy-intro", text: "Introduction" },
  { id: "spy-install", text: "Installing" },
  { id: "spy-use", text: "Using it" },
  { id: "spy-limits", text: "Limits" },
];

const meta = { title: "Scrollspy" } satisfies Meta;
export default meta;

export const Contents: Story = {
  render: () => {
    const [pane, setPane] = createSignal<HTMLElement>();
    return (
      <div class="demo-scrollspy">
        <nav aria-label="Contents">
          <Scrollspy entries={SECTIONS} root={pane} />
        </nav>
        <div class="demo-scrollspy__pane" ref={(element) => setPane(element)}>
          {SECTIONS.map((section) => (
            <section id={section.id} class="demo-scrollspy__section">
              <h2>{section.text}</h2>
              <p class="demo-text">
                Scroll this pane: the link of the heading that reached the line is the current one, and its
                `aria-current="true"` is the only state it carries.
              </p>
            </section>
          ))}
        </div>
      </div>
    );
  },
};
