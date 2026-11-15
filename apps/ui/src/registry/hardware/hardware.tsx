// The set's entry: a registry copy lands as one file, `hardware.tsx`, so this is the file a reader opens first. Every part
// stands beside it and is imported from here; the sheet arrives with them (`skin.css`, which brings `tokens-01.css`).
export { BarGraph, type BarGraphProps } from "./bar-graph.tsx";
export { Device, type DeviceProps } from "./device.tsx";
export { Dial, type DialProps } from "./dial.tsx";
export { BLACK_KEYS, Faceplate, type FaceplateProps, type KeyColor } from "./faceplate.tsx";
export { Fader, type FaderProps } from "./fader.tsx";
export { Key, type KeyProps } from "./key.tsx";
export { Lcd, type LcdProps } from "./lcd.tsx";
export { Led, type LedProps } from "./led.tsx";
export { Rocker, type RockerProps } from "./rocker.tsx";
export { SlideSwitch, type SlideSwitchProps } from "./slide-switch.tsx";
