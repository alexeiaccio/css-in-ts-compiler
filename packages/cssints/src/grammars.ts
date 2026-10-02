// The grammar of colorMix(), a literal for both its implementation (functions.ts) and its type (types.ts).
// `colorMix("oklab", a, "b 15%")`: the colour space (and a hue method for a polar one), then two colours, each with an optional share.
export const COLOR_MIX =
  "[ <rectangular-color-space> | <polar-color-space> <hue-interpolation-method>? ] [ <color> && <percentage [0,100]>? ]{2}" as const;
