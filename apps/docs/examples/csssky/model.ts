// What the card shows, as plain data: csssky's src/post/model.ts, cut to the text, the counts and the time.
export interface Facet {
  start: number;
  end: number;
  kind: string;
  uri?: string;
}
export interface Post {
  handle: string;
  name: string;
  text: string;
  createdAt: string;
  replies: number;
  reposts: number;
  likes: number;
  facets?: Facet[];
  link?: { uri: string; title: string; description: string };
}
export interface Part {
  text: string;
  facet?: Facet;
}

// The text cut at its facets. They count UTF-8 bytes, not characters.
export function parts(text: string, facets: Facet[] = []): Part[] {
  const bytes = new TextEncoder().encode(text);
  const slice = (a: number, b: number) => new TextDecoder().decode(bytes.slice(a, b));
  const out: Part[] = [];
  let at = 0;
  for (const facet of facets) {
    if (facet.start > at) out.push({ text: slice(at, facet.start) });
    out.push({ text: slice(facet.start, facet.end), facet });
    at = facet.end;
  }
  if (at < bytes.length) out.push({ text: slice(at, bytes.length) });
  return out;
}

const compact = new Intl.NumberFormat("en", { notation: "compact" });
// 1200 is "1.2K"; 0 is "" (no number beside the icon).
export const count = (n: number) => (n ? compact.format(n) : "");

// "now", "5m", "3h", "2d", then "Oct 2".
export function ago(iso: string, now = Date.now()) {
  const s = Math.max(0, (now - Date.parse(iso)) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" });
}

export const hostOf = (uri: string) => new URL(uri).host.replace(/^www\./, "");
