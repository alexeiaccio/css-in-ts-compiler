import {
  bg,
  borderRadius,
  cn,
  cv,
  display,
  flexShrink,
  height,
  objectFit,
  width,
} from "cssints" with { type: "cssints" };
import { Show } from "solid-js";

import { t } from "../theme.ts" with { type: "cssints" };

const avatar = cv({
  base: cn(display("block"), flexShrink(0), objectFit("cover"), bg(t.color.bgMuted())),
  variants: {
    size: {
      lg: cn(width(t.avatar.feed()), height(t.avatar.feed()), borderRadius(t.radius.avatar())),
      sm: cn(width("20px"), height("20px"), borderRadius(t.radius.avatarSmall())),
    },
  },
  defaultVariants: { size: "lg" },
});

// `src` is undefined when the account has none or its profile is labeled adult (mediaHidden): a plain disc then.
export function Avatar(props: { src?: string; size?: "lg" | "sm" }) {
  return (
    <Show when={props.src} fallback={<span class={avatar({ size: props.size })} />}>
      {(src) => <img class={avatar({ size: props.size })} src={src()} alt="" loading="lazy" />}
    </Show>
  );
}
