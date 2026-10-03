import * as css from "cssints" with { type: "cssints" };

export const clamp = css.cn(
  css.display("-webkit-box"),
  css.WebkitBoxOrient("vertical"),
  css.WebkitLineClamp(3),
  css.overflow("hidden"),
);
