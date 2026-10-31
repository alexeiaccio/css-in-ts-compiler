import { createPlayer, type PlaybackAdapter } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { For, merge, Show } from "solid-js";

import { t } from "../theme.ts" with { type: "cssints" };

export interface PlayerProps {
  /** The playback engine: the primitive drives it and never imports a media library. */
  readonly adapter: PlaybackAdapter;
  /** The media the adapter opens; the `<video>` shows the same source when the kind is `"video"`. */
  readonly src?: string | undefined;
  /** A video frame, or an audio bar. @default "video" */
  readonly kind?: "video" | "audio" | undefined;
  /** The surface's accessible name: what is playing. @default "Media player" */
  readonly label?: string | undefined;
  /** The line an audio bar shows; left out, the label. */
  readonly title?: string | undefined;
  /** A video's first frame, before anything is decoded: a URL or a `data:` URI. */
  readonly poster?: string | undefined;
  /** The video frame's shape in CSS, so the page picks the crop. @default "16 / 9" */
  readonly aspect?: string | undefined;
  /** The volume at mount, 0..100 (uncontrolled). @default 100 */
  readonly defaultVolume?: number | undefined;
  /** Muted at mount (uncontrolled). @default false */
  readonly defaultMuted?: boolean | undefined;
  /** The line under the player; left out, the keys in one sentence. */
  readonly hint?: string | undefined;
  readonly class?: string | undefined;
}

const DEFAULT_LABEL = "Media player";
const DEFAULT_ASPECT = "16 / 9";

const DEFAULT_HINT =
  "Space or K plays and pauses, the arrows seek five seconds and M mutes; on the seek slider the arrows move one second, Page Up and Page Down fifteen, Home and End jump.";

// The frame is the surface: the media sits at the top and the bar under it, and the radius and the border are the kit's.
const frameClass = css.cn(
  css.display("flex"),
  css.flexDirection("column"),
  css.overflow("hidden"),
  css.boxSizing("border-box"),
  css.color(t.color.text),
  css.bg(t.color.surface),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.xl),
  css.fontSize(t.font.size),
);

// The stage is the focusable surface the primitive's keys land on: the video frame or the audio bar, with the ring the kit
// paints, inset so the frame's rounded corners do not clip it.
const stageClass = css.cn(
  css.position("relative"),
  css.display("block"),
  css.width("100%"),
  css.overflow("hidden"),
  css.boxSizing("border-box"),
  css.bg(t.color.page),
  css.outline("none"),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("-2px")),
);

// The picture fills the stage and keeps its shape: a portrait video crops rather than squashing the frame's ratio.
const mediaClass = css.cn(
  css.display("block"),
  css.width("100%"),
  css.height("100%"),
  css.objectFit("cover"),
);

const audioClass = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.gap(t.space._3),
  css.minHeight(t.space._10),
  css.padding(t.space._2, t.space._3),
  css.boxSizing("border-box"),
);

const waveClass = css.cn(
  css.display("inline-flex"),
  css.alignItems("flex-end"),
  css.gap("2px"),
  css.height(t.space._6),
  css.flexShrink("0"),
);

const barMarkClass = css.cn(css.width("3px"), css.borderRadius("999px"), css.bg(t.color.highlight));

const audioTitleClass = css.cn(
  css.overflow("hidden"),
  css.whiteSpace("nowrap"),
  css.textOverflow("ellipsis"),
  css.fontWeight("500"),
);

const barClass = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.gap(t.space._2),
  css.padding(t.space._2, t.space._3),
);

// A button of the control bar. The transition is the skin's, and only for a reader who allows motion.
const buttonClass = css.cn(
  css.appearance("none"),
  css.display("inline-flex"),
  css.alignItems("center"),
  css.justifyContent("center"),
  css.height(t.space._8),
  css.minWidth(t.space._8),
  css.margin("0"),
  css.padding("0", t.space._2),
  css.boxSizing("border-box"),
  css.border("1px solid", t.color.border),
  css.borderRadius("999px"),
  css.bg(t.color.buttonBackground),
  css.color(t.color.text),
  css.fontSize(t.font.sizeSm),
  css.lineHeight(1),
  css.cursor("pointer"),
  css.hover(css.bg(t.color.buttonBackgroundPressed), css.borderColor(t.color.borderHover)),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
  css.media("(prefers-reduced-motion: no-preference)")(
    css.transition("background-color 120ms ease-out, border-color 120ms ease-out"),
  ),
);

// The mute toggle's look reads its pressed state, which the primitive announces: the skin paints `aria-pressed`.
const muteButtonClass = css.cn(
  buttonClass,
  css.attr("aria-pressed", "true")(
    css.bg(t.color.buttonBackgroundPressed),
    css.borderColor(t.color.borderHover),
  ),
);

const timeClass = css.cn(
  css.fontSize(t.font.sizeSm),
  css.color(t.color.text),
  css.fontVariantNumeric("tabular-nums"),
  css.whiteSpace("nowrap"),
);

const seekClass = css.cn(
  css.position("relative"),
  css.display("flex"),
  css.alignItems("center"),
  css.flex("1"),
  css.minWidth("0"),
  css.height(t.space._7),
  css.margin("0"),
  css.padding("0"),
  css.outline("none"),
  css.cursor("pointer"),
  css.borderRadius(t.radius.sm),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
);

// The rail sits on the slider's middle line and clips the fill; the thumb overflows it, so it is the slider's own child.
const railClass = css.cn(
  css.position("absolute"),
  css.left("0"),
  css.right("0"),
  css.top("50%"),
  css.height(t.space._1),
  css.transform("translateY(-50%)"),
  css.overflow("hidden"),
  css.borderRadius("999px"),
  css.bg(t.color.buttonBackground),
);

// The fill is the skin's, and the width is set inline from the primitive's `aria-valuenow` and `aria-valuemax`. The
// transition follows a seek; the motion preference turns it off.
const fillClass = css.cn(
  css.height("100%"),
  css.bg(t.color.highlight),
  css.borderRadius("999px"),
  css.media("(prefers-reduced-motion: no-preference)")(css.transition("width 160ms linear")),
);

const thumbClass = css.cn(
  css.position("absolute"),
  css.top("50%"),
  css.width(t.space._3),
  css.height(t.space._3),
  css.transform("translate(-50%, -50%)"),
  css.boxSizing("border-box"),
  css.border("1px solid", t.color.border),
  css.borderRadius("999px"),
  css.bg(t.color.surface),
);

const hintClass = css.cn(css.margin("0"), css.fontSize(t.font.sizeSm), css.color(t.color.muted));

/** `m:ss`, the primitive's own `aria-valuetext` format: the time line and the slider cannot disagree. */
const mss = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds) % 60).padStart(2, "0")}`;

/** The audio bar's drawn waveform: percentages of the bar's height, so the shape is the fixture data's. */
const AUDIO_BARS = [35, 70, 45, 90, 60, 30, 75, 50, 85, 40, 65, 25] as const;

/**
 * A media player, styled: `createPlayer` owns the playback stage, the position and the duration, the seek's `role="slider"`
 * with its `aria-value*` and its keys, the play/pause label, the mute toggle's `aria-pressed`, the four preferences and the
 * surface keys (Space / K, the arrows, M, F). The adapter is the caller's, so the primitive never imports a media library.
 *
 * The skin owns the surface (a video frame or an audio bar), the frame's radius, border and tokens in light and dark, the
 * control bar, the seek's rail, fill and thumb, the time line, and the reduced-motion rules. It does not call the `<video>`
 * element's own playback: the adapter decodes, and the element is the picture frame (`preload="none"`, the caller's
 * `poster`). A page whose adapter paints elsewhere passes its own surface. Fullscreen is the primitive's state only, since
 * a page may fullscreen a container the skin does not own.
 */
export const Player = (props: PlayerProps): JSX.Element => {
  const player = createPlayer({
    adapter: props.adapter,
    get src() {
      return props.src;
    },
    defaultVolume: props.defaultVolume,
    defaultMuted: props.defaultMuted,
  });

  // The time, the fill and the thumb all read the primitive's ARIA, so a seek and a playback tick cannot drift apart.
  const now = (): number => player.seekProps["aria-valuenow"];
  const total = (): number => player.seekProps["aria-valuemax"];
  const percent = (): number => (total() <= 0 ? 0 : (now() / total()) * 100);

  // The glyph reads the same state the button's name does, so the two cannot disagree.
  const active = (): boolean => player.playProps["aria-label"] === "Pause";

  let seekElement: HTMLDivElement | undefined;

  // A press on the rail seeks to that point. ponytail: no drag is wired; add pointermove + setPointerCapture when a page
  // asks to scrub, and throttle it to the frame.
  const seekAt = (event: PointerEvent): void => {
    const box = seekElement?.getBoundingClientRect();
    if (box === undefined || box.width <= 0 || total() <= 0) {
      return;
    }
    const fraction = (event.clientX - box.left) / box.width;
    player.seek(fraction * total());
  };

  const surface = merge(player.surfaceProps, {
    role: "group" as const,
    get "aria-label"() {
      return props.label ?? DEFAULT_LABEL;
    },
    "data-part": "player-surface",
    get class() {
      return stageClass;
    },
  });

  const play = merge(player.playProps, {
    "data-part": "player-play",
    get class() {
      return buttonClass;
    },
  });

  const seek = merge(player.seekProps, {
    "aria-label": "Seek",
    "data-part": "player-seek",
    get class() {
      return seekClass;
    },
    onPointerDown: seekAt,
  });

  const mute = merge(player.muteProps, {
    "data-part": "player-mute",
    get class() {
      return muteButtonClass;
    },
  });

  return (
    <div data-part="player" class={css.cn(frameClass, props.class)}>
      <div
        {...surface}
        style={props.kind === "audio" ? {} : { "aspect-ratio": props.aspect ?? DEFAULT_ASPECT }}
      >
        <Show
          when={props.kind === "audio"}
          fallback={
            <video
              data-part="player-media"
              src={props.src}
              poster={props.poster}
              preload="none"
              playsinline
              aria-hidden="true"
              class={mediaClass}
            />
          }
        >
          <div data-part="player-audio" class={audioClass}>
            <span aria-hidden="true" class={waveClass}>
              <For each={AUDIO_BARS}>
                {(height) => <span class={barMarkClass} style={{ height: `${height}%` }} />}
              </For>
            </span>
            <span class={audioTitleClass}>{props.title ?? props.label ?? DEFAULT_LABEL}</span>
          </div>
        </Show>
      </div>
      <div data-part="player-bar" class={barClass}>
        <button {...play}>
          <span aria-hidden="true">{active() ? "❚❚" : "▶"}</span>
        </button>
        <span data-part="player-time" class={timeClass}>
          {`${mss(now())} / ${mss(total())}`}
        </span>
        <div
          {...seek}
          ref={(element: HTMLDivElement) => {
            seekElement = element;
          }}
        >
          <div aria-hidden="true" class={railClass}>
            <div data-part="player-fill" class={fillClass} style={{ width: `${percent()}%` }} />
          </div>
          <span
            aria-hidden="true"
            data-part="player-thumb"
            class={thumbClass}
            style={{ left: `${percent()}%` }}
          />
        </div>
        <button {...mute}>Mute</button>
      </div>
      <p data-part="player-hint" class={hintClass}>
        {props.hint ?? DEFAULT_HINT}
      </p>
    </div>
  );
};
