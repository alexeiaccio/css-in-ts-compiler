import {
  aspectRatio,
  bg,
  border,
  borderRadius,
  boxSizing,
  cn,
  color,
  display,
  flex,
  fontSize,
  fontWeight,
  height,
  lineHeight,
  margin,
  marginTop,
  minWidth,
  objectFit,
  overflowWrap,
  padding,
  paddingInline,
  width,
} from "cssints" with { type: "cssints" };
import { Show } from "solid-js";
import type { AppBskyActorDefs } from "@atcute/bluesky";

import { narrow } from "../layout.ts" with { type: "cssints" };
import { RichText } from "../post/RichText.tsx";
import { t } from "../theme.ts" with { type: "cssints" };
import { bioFacets, stat } from "./model.ts";

// The header's layout follows the width of the column (container "column", Mu's narrow < 500 px), not the window's: wide, the
// avatar sits beside the name and overlaps the banner by half; narrow, the avatar is smaller and the name stacks under it.
const banner = cn(display("block"), width("100%"), aspectRatio("3 / 1"), bg(t.color.bgMuted()));
const bannerImg = cn(display("block"), width("100%"), height("100%"), objectFit("cover"));

const top = cn(
  flex().alignItems("flex-end").gap(t.space.md()),
  paddingInline(t.gutter.base()),
  narrow(
    flex().direction("column").alignItems("flex-start").gap(t.space.sm()),
    paddingInline(t.gutter.compact()),
  ),
);
// the ring is the page colour, so the avatar reads as cut out of the banner; the radius is the token the square-avatars flag moves
const avatar = cn(
  display("block"),
  boxSizing("border-box"),
  width("96px"),
  height("96px"),
  marginTop("-48px"),
  objectFit("cover"),
  bg(t.color.bgMuted()),
  border("4px", "solid", t.color.bg()),
  borderRadius(t.radius.avatar()),
  narrow(width("72px"), height("72px"), marginTop("-36px")),
);
const ident = cn(minWidth("0"), padding(t.space.xs(), "0"));
const name = cn(
  margin("0"),
  fontSize(t.fontSize["2xl"]()),
  lineHeight(t.lineHeight.tight()),
  fontWeight(t.fontWeight.bold()),
  overflowWrap("anywhere"),
  narrow(fontSize(t.fontSize.xl())),
);
const handle = cn(color(t.color.textMedium()), overflowWrap("anywhere"));

const body = cn(
  flex().direction("column").gap(t.space.sm()),
  padding(t.space.sm(), t.gutter.base(), t.space.lg()),
  narrow(paddingInline(t.gutter.compact())),
);
const counts = cn(flex().wrap("wrap").gap(t.space.lg()), color(t.color.textMedium()));
const strong = cn(color(t.color.text()), fontWeight(t.fontWeight.bold()));

// `hidden`: the account's profile is labeled adult, so there is no banner and avatar to show (a flat tile instead).
export function ProfileHeader(props: {
  profile: AppBskyActorDefs.ProfileViewDetailed;
  hidden: boolean;
}) {
  const p = () => props.profile;
  return (
    <header>
      <div class={banner}>
        <Show when={!props.hidden && p().banner}>
          {(src) => <img class={bannerImg} src={src()} alt="" />}
        </Show>
      </div>
      <div class={top}>
        <Show
          when={!props.hidden && p().avatar}
          fallback={<span class={avatar} data-profile-avatar />}
        >
          {(src) => <img class={avatar} src={src()} alt="" data-profile-avatar />}
        </Show>
        <div class={ident}>
          <h2 class={name}>{p().displayName || p().handle}</h2>
          <div class={handle}>@{p().handle}</div>
        </div>
      </div>
      <div class={body}>
        <Show when={p().description}>
          {(text) => <RichText text={text()} facets={bioFacets(text())} />}
        </Show>
        <div class={counts}>
          <span>
            <span class={strong}>{stat(p().followersCount)}</span> followers
          </span>
          <span>
            <span class={strong}>{stat(p().followsCount)}</span> following
          </span>
          <span>
            <span class={strong}>{stat(p().postsCount)}</span> posts
          </span>
        </div>
      </div>
    </header>
  );
}
