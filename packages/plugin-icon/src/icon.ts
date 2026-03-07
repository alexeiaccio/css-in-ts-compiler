import * as Effect from "effect";
import type { CSSProperties } from "@cssints/compiler";

export interface IconConfig {
  collection: string;
  name?: string;
  color?: string;
  size?: string;
}

export function icon(config: IconConfig): CSSProperties {
  const {
    collection,
    name = config.name || "",
    color = "currentColor",
    size = "24px",
  } = config;

  return {
    "mask-image": `url('${collection}:${name}')`,
    "-webkit-mask-image": `url('${collection}:${name}')`,
    "mask-size": "contain",
    "-webkit-mask-size": "contain",
    "mask-repeat": "no-repeat",
    "-webkit-mask-repeat": "no-repeat",
    "mask-position": "center",
    "-webkit-mask-position": "center",
    width: size,
    height: size,
    "background-color": color,
    display: "inline-block",
  };
}
