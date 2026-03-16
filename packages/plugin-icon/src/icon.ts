export interface IconConfig {
  collection: string;
  name?: string;
  color?: string;
  size?: string;
}

export interface IconStyles {
  maskImage: string;
  webkitMaskImage: string;
  maskSize: string;
  webkitMaskSize: string;
  maskRepeat: string;
  webkitMaskRepeat: string;
  maskPosition: string;
  webkitMaskPosition: string;
  width: string;
  height: string;
  backgroundColor: string;
  display: string;
}

export function icon(config: IconConfig): IconStyles {
  const { collection, name = "", color = "currentColor", size = "24px" } = config;

  return {
    maskImage: `url('${collection}:${name}')`,
    webkitMaskImage: `url('${collection}:${name}')`,
    maskSize: "contain",
    webkitMaskSize: "contain",
    maskRepeat: "no-repeat",
    webkitMaskRepeat: "no-repeat",
    maskPosition: "center",
    webkitMaskPosition: "center",
    width: size,
    height: size,
    backgroundColor: color,
    display: "inline-block",
  };
}