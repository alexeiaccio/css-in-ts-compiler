// The set, as stories: the device first (the proof that the parts stand together), then each mechanism on its own. Every
// story stands on a `Faceplate`, because the sheet is scoped to the panel — a part without one has no skin at all.
import type { Meta, Story } from "@cssints/stories";

import { BarGraph } from "./bar-graph.tsx";
import { Device, type DeviceProps } from "./device.tsx";
import { Dial } from "./dial.tsx";
import { Faceplate, type KeyColor } from "./faceplate.tsx";
import { Fader } from "./fader.tsx";
import { Key } from "./key.tsx";
import { Lcd } from "./lcd.tsx";
import { Led } from "./led.tsx";
import { Rocker } from "./rocker.tsx";
import { SlideSwitch } from "./slide-switch.tsx";

const meta = {
  title: "Hardware (skin 01)",
  component: Device,
} satisfies Meta<DeviceProps>;
export default meta;

const column = {
  display: "grid",
  gap: "18px",
  "justify-items": "start",
} as const;

/** The proof of the set: one dashboard whose keys, fader and dial move the same number the screen shows. */
export const Dashboard: Story<DeviceProps> = {};

/** One colour in, every role out: the caps, the lamp, the fader's fill and the ring all follow the panel's key colour. */
export const KeyColours: Story<DeviceProps> = {
  name: "Key colours",
  render: () => {
    const colours: ReadonlyArray<KeyColor> = [
      { l: 0.24, c: 0, h: 0 },
      { l: 0.45, c: 0.14, h: 255 },
      { l: 0.62, c: 0.2, h: 145 },
      { l: 0.86, c: 0.16, h: 96 },
    ];
    return (
      <div style={column}>
        {colours.map((keyColor) => (
          <Faceplate keyColor={keyColor}>
            <div style={{ display: "flex", gap: "14px", "align-items": "center" }}>
              <Key label="Mute" legend="Mute" />
              <Key label="Hold" legend="Hold" isToggle defaultValue />
              <Led label="Signal present" legend="Sig" on />
              <Fader label="Level" min={0} max={100} defaultValue={64} />
            </div>
          </Faceplate>
        ))}
      </div>
    );
  },
};

/** A command key, a latch, and a latch held down: `aria-pressed` is the whole of the difference. */
export const Keys: Story<DeviceProps> = {
  render: () => (
    <Faceplate title="Keys">
      <div style={{ ...column, gap: "14px" }}>
        <div style={{ display: "flex", gap: "14px", "align-items": "flex-end" }}>
          <Key label="Arm" />
          <Key label="Mute the output" legend="Mute" isToggle />
          <Key label="Hold" legend="Hold" isToggle defaultValue />
        </div>
        <div style={{ display: "flex", gap: "14px", "align-items": "flex-end" }}>
          <Rocker label="Power" offLabel="Off" onLabel="On" />
          <Rocker label="Source" offLabel="Aux" onLabel="Tape" defaultValue />
          <SlideSwitch label="Phantom power" offLabel="48V" onLabel="Off" />
        </div>
      </div>
    </Faceplate>
  ),
};

/** The two continuous controls: a fader with its printed scale, and a dial with its printed arc and pointer. */
export const Controls: Story<DeviceProps> = {
  render: () => (
    <Faceplate title="Levels">
      <div style={column}>
        <Fader label="Level" min={0} max={100} defaultValue={40} />
        <Fader label="Pan" min={-50} max={50} defaultValue={0} />
        <div style={{ display: "flex", gap: "28px", "align-items": "flex-start" }}>
          <Dial label="Tone" min={0} max={10} step={1} defaultValue={5} />
          <Dial label="Gain" min={0} max={100} defaultValue={70} size="4rem" />
        </div>
      </div>
    </Faceplate>
  ),
};

/** The readouts: the screen, the lamp and the graph. The screen's value is a live region; its tag is not. */
export const Readouts: Story<DeviceProps> = {
  render: () => (
    <Faceplate title="Readouts">
      <div style={column}>
        <div style={{ display: "flex", gap: "18px", "align-items": "flex-start" }}>
          <Lcd tag="Level" value="40%" />
          <Lcd tag="Note">Recording — take 3</Lcd>
        </div>
        <div style={{ display: "flex", gap: "18px", "align-items": "center" }}>
          <Led label="Signal present" legend="Sig" on />
          <Led label="Peak" legend="Peak" />
        </div>
        <BarGraph label="Signal level" value={62} segments={12} />
      </div>
    </Faceplate>
  ),
};
