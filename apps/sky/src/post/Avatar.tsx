import { _cv } from "cssints";
import * as css from "cssints" with { type: "cssints" };
import { Show } from "solid-js";

import { t } from "../theme.ts" with { type: "cssints" };

const avatar = _cv(
  css.cv({
    base: css.cn(
      css.display("block"),
      css.flexShrink(0),
      css.objectFit("cover"),
      css.bg(t.color.bgMuted),
    ),
    variants: {
      size: {
        lg: css.cn(
          css.width(t.avatar.feed),
          css.height(t.avatar.feed),
          css.borderRadius(t.radius.avatar),
        ),
        sm: css.cn(css.width("20px"), css.height("20px"), css.borderRadius(t.radius.avatarSmall)),
      },
    },
    defaultVariants: { size: "lg" },
  }),
);

// `src` is undefined when the account has none or its profile is labeled adult (mediaHidden): a plain disc then.
export function Avatar(props: { src?: string; size?: "lg" | "sm" }) {
  return (
    <Show when={props.src} fallback={<span class={avatar({ size: props.size })} />}>
      {(src) => <img class={avatar({ size: props.size })} src={src()} alt="" loading="lazy" />}
    </Show>
  );
}
