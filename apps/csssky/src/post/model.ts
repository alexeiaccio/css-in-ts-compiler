// What the post card draws, as plain data: the API's embed unions become a few shapes, and the choices (which embed, how
// many grid columns, which text) are pure functions that test/post.mjs runs on recorded posts. No cssints, no Solid here.
import { unwrapEmbed } from "@atcute/bluesky";
import type { AppBskyEmbedRecord, AppBskyFeedDefs } from "@atcute/bluesky";
import { segmentize } from "@atcute/bluesky-richtext-segmenter";
import type { Facet } from "@atcute/bluesky-richtext-segmenter";

import { quoteOf } from "../api.ts";
import type { Quote } from "../api.ts";

type PostView = AppBskyFeedDefs.PostView;
type MediaEmbed = NonNullable<ReturnType<typeof unwrapEmbed>["media"]>;

export interface Tile {
  thumb: string;
  full: string;
  alt: string;
  ratio: number; // width / height, clamped
}
export type Media =
  | { kind: "images"; tiles: Tile[] } // 1 to 4
  | { kind: "gallery"; tiles: Tile[]; more: number } // the first 4 of 5 to 20, and how many are left
  | { kind: "external"; uri: string; title: string; description: string; thumb?: string }
  | { kind: "video"; poster?: string; ratio: number; alt: string; gif: boolean };

// 34 of 4 356 images were wider than 1:0.3: keep a box between 1:2 and 3:1 and crop with object-fit.
export const clampRatio = (a?: { width: number; height: number }) =>
  a ? Math.min(3, Math.max(0.5, a.width / a.height)) : 4 / 3; // 2% of images have none: 4:3

const GALLERY_SHOWN = 4;

// One embed view as a Media, or undefined (a record, or a kind this version does not know).
export function mediaOf(e: MediaEmbed | { $type: string } | undefined): Media | undefined {
  const m = e as MediaEmbed | undefined;
  switch (m?.$type) {
    case "app.bsky.embed.images#view":
      return {
        kind: "images",
        tiles: m.images.map((i) => ({
          thumb: i.thumb,
          full: i.fullsize,
          alt: i.alt,
          ratio: clampRatio(i.aspectRatio),
        })),
      };
    case "app.bsky.embed.gallery#view":
      return {
        kind: "gallery",
        tiles: m.items.slice(0, GALLERY_SHOWN).map((i) => ({
          thumb: i.thumbnail, // not `thumb`, as in images
          full: i.fullsize,
          alt: i.alt,
          ratio: clampRatio(i.aspectRatio),
        })),
        more: Math.max(0, m.items.length - GALLERY_SHOWN),
      };
    case "app.bsky.embed.external#view": {
      const { uri, title, description, thumb } = m.external;
      return { kind: "external", uri, title, description, thumb };
    }
    case "app.bsky.embed.video#view":
      return {
        kind: "video",
        poster: m.thumbnail,
        ratio: clampRatio(m.aspectRatio),
        alt: m.alt ?? "",
        gif: m.presentation === "gif",
      };
    default:
      return undefined;
  }
}

// The media of a post (also in recordWithMedia) and its quote, if any.
export function embedParts(p: PostView): { media?: Media; quote?: Quote } {
  return { media: mediaOf(unwrapEmbed(p.embed).media), quote: quoteOf(p) };
}

// The first media of a quoted post, as one small tile (the quote card shows one image, not a grid).
export function quoteMedia(q: AppBskyEmbedRecord.ViewRecord): Media | undefined {
  const first = q.embeds?.[0];
  const m = mediaOf(first && "media" in first ? first.media : first);
  return m && (m.kind === "images" || m.kind === "gallery")
    ? { kind: "images", tiles: m.tiles.slice(0, 1) }
    : m;
}

// Which grid an images or gallery embed gets: the class variant the card picks (the columns come from the card's width).
export const gridOf = (m: Media & { tiles: Tile[] }) =>
  m.kind === "gallery" ? "gallery" : (String(m.tiles.length) as "1" | "2" | "3" | "4");

// ---- text ------------------------------------------------------------------------------------
export type Feature = { $type: string; uri?: string; did?: string };
interface PostRecord {
  text?: string;
  facets?: Facet<Feature>[];
  createdAt?: string;
}
// `record` and a quote's `value` are unknown in the lexicon
export const recordOf = (p: PostView | AppBskyEmbedRecord.ViewRecord): PostRecord =>
  ((p as PostView).record ?? (p as AppBskyEmbedRecord.ViewRecord).value ?? {}) as PostRecord;

export interface Part {
  text: string; // what is shown
  link?: string; // an http(s) feature.uri: the href, which is not the text (often shortened)
  mention?: string; // a did: /profile/<did>
  tag?: boolean; // no search without a login: only coloured
}
// The text cut at its facets (UTF-8 byte offsets, which segmentize handles) into the parts the card draws.
export const parts = (text: string, facets?: Facet<Feature>[]): Part[] =>
  segmentize(text, facets).map(({ text, features }) => {
    const f = features?.[0];
    if (f?.$type === "app.bsky.richtext.facet#link") return { text, link: safeHref(f.uri ?? "") };
    if (f?.$type === "app.bsky.richtext.facet#mention") return { text, mention: f.did };
    return { text, tag: f?.$type === "app.bsky.richtext.facet#tag" };
  });

// A link feature's uri is the href, never the visible text; only http(s) is a link.
export function safeHref(uri: string) {
  try {
    return /^https?:$/.test(new URL(uri).protocol) ? uri : undefined;
  } catch {
    return undefined;
  }
}

export const hostOf = (uri: string) => {
  try {
    return new URL(uri).host.replace(/^www\./, "");
  } catch {
    return uri;
  }
};

// ---- numbers and places ----------------------------------------------------------------------
const compact = new Intl.NumberFormat("en", { notation: "compact" });
// 1200 is "1.2K"; 0 is "" (no number beside the icon).
export const count = (n: number | undefined) => (n ? compact.format(n) : "");

// "now", "5m", "3h", "2d", then "Oct 2" (with the year when it is not this one).
export function ago(iso: string | undefined, now = Date.now()) {
  const t = Date.parse(iso ?? "");
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, (now - t) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d`;
  const d = new Date(t);
  return d.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() === new Date(now).getFullYear() ? undefined : "numeric",
  });
}

// The focused post's timestamp: "October 2, 2026 at 7:14 PM".
export const fullTime = (iso: string | undefined) => {
  const t = Date.parse(iso ?? "");
  return Number.isNaN(t)
    ? ""
    : new Date(t).toLocaleString("en", { dateStyle: "long", timeStyle: "short" });
};

// The focused post's counts row: only the counters that are not zero, in full ("1,204 likes").
export function stats(p: PostView): { n: string; label: string }[] {
  const all = [
    [p.replyCount, "reply", "replies"],
    [p.repostCount, "repost", "reposts"],
    [p.quoteCount, "quote", "quotes"],
    [p.likeCount, "like", "likes"],
  ] as const;
  return all.flatMap(([n, one, many]) =>
    n ? [{ n: n.toLocaleString("en"), label: n === 1 ? one : many }] : [],
  );
}

// The app's route for a post (the thread screen); the same path on bsky.app is where a video plays.
export const postHref = (p: { uri: string; author: { handle: string } }) =>
  `/profile/${p.author.handle}/post/${p.uri.slice(p.uri.lastIndexOf("/") + 1)}`;
