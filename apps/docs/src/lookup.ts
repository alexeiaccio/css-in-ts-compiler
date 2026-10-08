// The search: the headings and the bold terms of every page, matched as words (all of them) against the text and the page title.
export interface Hit {
  slug: string;
  id: string;
  text: string;
  page: string;
  depth: number;
}
interface Source {
  slug: string;
  title: string;
  entries: readonly { id: string; text: string; depth: number }[];
}

export const createIndex = (pages: readonly Source[]): Hit[] =>
  pages.flatMap((p) => [
    { slug: p.slug, id: "", text: p.title, page: p.title, depth: 1 },
    ...p.entries.map((e) => ({
      slug: p.slug,
      id: e.id,
      text: e.text,
      page: p.title,
      depth: e.depth,
    })),
  ]);

// A word at the start of a word of the text scores 4, inside a word 2, and in the page title only 1; every word has to score, and
// one of them in the text itself (a term is not a hit for the name of its page alone). A shallower heading wins a tie.
export function search(index: readonly Hit[], query: string, limit = 10): Hit[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const scored: [Hit, number][] = [];
  for (const hit of index) {
    const text = hit.text.toLowerCase();
    const page = hit.page.toLowerCase();
    let score = 0;
    let inText = false;
    for (const w of words) {
      const at = text.indexOf(w);
      const s = at < 0 ? (page.includes(w) ? 1 : 0) : /\w/.test(text.charAt(at - 1)) ? 2 : 4;
      if (s === 0) {
        score = 0;
        break;
      }
      score += s;
      inText ||= at >= 0;
    }
    if (score > 0 && inText) scored.push([hit, score - hit.depth * 0.1]);
  }
  return scored
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([hit]) => hit);
}
