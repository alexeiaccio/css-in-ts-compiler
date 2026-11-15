import type { JSX } from "@solidjs/web";
import { createSignal } from "solid-js";

import { BarGraph } from "./bar-graph.tsx";
import { Dial } from "./dial.tsx";
import { Faceplate, type KeyColor } from "./faceplate.tsx";
import { Fader } from "./fader.tsx";
import { Key } from "./key.tsx";
import { Lcd } from "./lcd.tsx";
import { Led } from "./led.tsx";

export interface DeviceProps {
  /** The panel's key colour; every cap, the pointer, the lamp and the graph follow it. @default BLACK_KEYS */
  readonly keyColor?: KeyColor | undefined;
}

/** Ten percent a press: the two step keys are the coarse control, the fader the fine one. */
const STEP = 10;

/**
 * A dashboard faceplate: the screen and the signal graph across the top, the keys and the lamp under them, the fader and the
 * dial at the bottom. It is the set shown as one instrument, and the only stateful part of the skin — every value on it comes
 * from the primitives underneath, so the keys, the fader and the dial all move the same number and the screen shows it.
 */
export const Device = (props: DeviceProps): JSX.Element => {
  const [level, setLevel] = createSignal(40);
  const [muted, setMuted] = createSignal(false);
  const [tone, setTone] = createSignal(5);

  const nudge = (delta: number): void => {
    setLevel((value) => Math.min(100, Math.max(0, value + delta)));
  };

  return (
    <Faceplate title="Output unit 01" keyColor={props.keyColor}>
      <div data-part="device">
        <div data-part="device-row">
          <Lcd tag="Level" value={muted() ? "MUTED" : `${level()}%`} />
          <BarGraph label="Signal level" value={muted() ? 0 : level()} segments={12} />
        </div>
        <div data-part="device-row">
          <Key label="Lower the level" legend="−" onClick={() => nudge(-STEP)} />
          <Key
            label="Mute the output"
            legend="Mute"
            isToggle
            value={muted()}
            onValueChange={setMuted}
          />
          <Key label="Raise the level" legend="+" onClick={() => nudge(STEP)} />
          <Led label="Signal present" legend="Sig" on={!muted()} />
        </div>
        <div data-part="device-row">
          <Fader label="Level" min={0} max={100} value={level()} onValueChange={setLevel} />
          <Dial label="Tone" min={0} max={10} step={1} value={tone()} onValueChange={setTone} />
        </div>
      </div>
    </Faceplate>
  );
};
