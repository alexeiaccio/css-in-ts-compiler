import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";

import { Knob } from "./knob.tsx";

/**
 * The starter in ordinary use: a volume from 0 to 100 with a percentage, and a pan from -50 to 50 whose centre is
 * its own word. The sentence under the dials is the whole contract, so a reader needs no source to try them.
 */
export const KnobExample = (props: { readonly class?: string | undefined }): JSX.Element => (
  <div class={props.class === undefined ? "demo-column" : `demo-column ${props.class}`}>
    <div class="demo-row" style={{ "align-items": "flex-start", gap: "2rem" }}>
      <Knob label="Volume" defaultValue={65} format={(value) => `${value}%`} />
      <Knob
        label="Pan"
        min={-50}
        max={50}
        step={5}
        defaultValue={0}
        format={(value) => (value === 0 ? "Centre" : value < 0 ? `${-value} L` : `${value} R`)}
      />
    </div>
    <p class="demo-text">
      Drag a dial to turn it — around its centre or straight up and down; focus it and the arrow
      keys step, Page Up and Page Down jump ten steps, and Home and End go to the ends.
    </p>
  </div>
);

/** What a mounted demo hands the test: where it lives and a teardown. */
export interface MountedKnob {
  readonly root: HTMLElement;
  readonly dispose: () => void;
}

/** Mounts the styled knobs the way the docs page does. */
export const mountKnob = (): MountedKnob => {
  const root = document.createElement("div");
  document.body.append(root);
  const dispose = render(() => <KnobExample />, root);
  return {
    root,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
