// Portable Text (https://portabletext.org) back to the markdown the docs build reads. Node only (plugin/pds.ts calls it).
//
// The pages of README.md and docs/API.md can live in the cssints PDS as CMS documents, written there by the importer of
// effects-of-atmosphere (tools/cms-import/src/portable-markdown.ts, which also reads markdown into this shape and refuses what
// it cannot keep). This is the other half: the same mapping, read the other way, so the build below it (plugin/markdown.ts:
// the headings, the ids, the links, Shiki and twoslash) is the one that already exists and does not know where the text came
// from. The two files are a pair: test/fixtures/pds/ holds the importer's output for a page with every construct, and
// test/pds.mjs asserts that this file writes that page back byte for byte as the importer's own serializer does.
//
// The mapping: a paragraph, a heading (`h1`..`h6`) or a quote is a `block` with a `style`; bold, italic, strike, code and links
// are marks on its spans (a link is a `markDef`); a list item is a block with `listItem` (`bullet` | `number`) and `level`, and
// `loose` on it when the list renders its items in paragraphs; a block that sits under a list item but is not its first line
// carries `itemLevel`; the rest are custom blocks: `code` (`language`, `meta`, `code`), `table`, `html`, `thematicBreak`. A block
// of any other type is the site's own (a section, an image) and markdown has no word for it: it is left out.

// what a record holds is JSON that nobody has checked, so every read of it says what it expects
type Obj = Record<string, unknown>;

const str = (value: unknown) => (typeof value === "string" ? value : undefined);
const num = (value: unknown) => (typeof value === "number" ? value : undefined);
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const objs = (value: unknown): Obj[] =>
  arr(value).filter(
    (one): one is Obj => typeof one === "object" && one !== null && !Array.isArray(one),
  );

// text is literal in Portable Text, so what markdown would read as markup is escaped
const escapeText = (text: string, inTable: boolean) => {
  const escaped = text
    .replace(/[\\`*[\]<]/g, (c) => `\\${c}`)
    .replace(/(?<![A-Za-z0-9])_|_(?![A-Za-z0-9])/g, "\\_")
    .replace(/~(?=~)|(?<=~)~/g, "\\~")
    .replace(/&(?=#?\w+;)/g, "\\&");
  return inTable ? escaped.replace(/\|/g, "\\|") : escaped;
};

// a line of a paragraph that markdown would take for a block of its own
const escapeLineStart = (text: string) =>
  text
    .split("\n")
    .map((line) =>
      line
        .replace(/^(\s*)(#{1,6})(?=\s|$)/, "$1\\$2")
        .replace(/^(\s*)>/, "$1\\>")
        .replace(/^(\s*)([-+])(?=\s|$)/, "$1\\$2")
        .replace(/^(\s*)(\d+)(?=[.)](\s|$))/, "$1$2\\"),
    )
    .join("\n");

const codeSpan = (text: string, inTable: boolean) => {
  const longest = Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length));
  const ticks = "`".repeat(longest + 1);
  const pad =
    text.startsWith("`") ||
    text.endsWith("`") ||
    (text.startsWith(" ") && text.endsWith(" ") && text.trim() !== "")
      ? " "
      : "";
  const body = inTable ? text.replace(/\|/g, "\\|") : text;
  return `${ticks}${pad}${body}${pad}${ticks}`;
};

const inline = (node: Obj, inTable: boolean) => {
  const defs = new Map(objs(node.markDefs).map((def) => [str(def._key), def]));
  const opener = (mark: string) => {
    if (defs.has(mark)) return "[";
    if (mark === "strong") return "**";
    if (mark === "em") return "*";
    if (mark === "strike-through") return "~~";
    return "";
  };
  const closer = (mark: string) => {
    const def = defs.get(mark);
    if (!def) return opener(mark);
    const title = str(def.title);
    return `](${str(def.href) ?? ""}${title === undefined ? "" : ` "${title}"`})`;
  };
  const decorating = (mark: string) =>
    defs.has(mark) || mark === "strong" || mark === "em" || mark === "strike-through";

  // the markup written so far and the marks it has open: the state of a left-to-right pass
  let out = "";
  let open: string[] = [];
  // a closing mark cannot follow whitespace, nor an opening one precede it: the whitespace moves outside
  const close = (marks: string[]) => {
    for (const mark of [...marks].reverse()) {
      const trailing = /\s+$/.exec(out)?.[0] ?? "";
      out = out.slice(0, out.length - trailing.length) + closer(mark) + trailing;
    }
  };

  for (const span of objs(node.children)) {
    const marks = arr(span.marks).flatMap((mark) => (typeof mark === "string" ? [mark] : []));
    const whole = str(span.text) ?? "";
    const code = marks.includes("code");
    const wanted = marks.filter(decorating);
    const different = wanted.findIndex((mark, index) => open[index] !== mark);
    const shared = different === -1 ? wanted.length : different;
    close(open.slice(shared));
    const opening = wanted.slice(shared);
    const leading = opening.length > 0 && !code ? (/^\s+/.exec(whole)?.[0] ?? "") : "";
    const text = whole.slice(leading.length);
    out += leading + opening.map(opener).join("");
    open = wanted;
    out += code ? codeSpan(text, inTable) : escapeText(text, inTable);
  }
  close(open);
  return out;
};

const fence = (code: string) =>
  "`".repeat(Math.max(2, ...(code.match(/^\s*`{3,}/gm) ?? []).map((run) => run.trim().length)) + 1);

const indented = (text: string, indent: string) =>
  indent === ""
    ? text
    : text
        .split("\n")
        .map((line) => (line === "" ? line : `${indent}${line}`))
        .join("\n");

const table = (node: Obj) => {
  const row = (cells: Obj[]) => `| ${cells.map((cell) => inline(cell, true)).join(" | ")} |`;
  const align = arr(node.align).map((one) => {
    if (one === "left") return ":--";
    if (one === "right") return "--:";
    if (one === "center") return ":-:";
    return "---";
  });
  return [
    row(objs(node.header)),
    `| ${align.join(" | ")} |`,
    ...arr(node.rows).map((cells) => row(objs(cells))),
  ].join("\n");
};

// one block as a chunk of markdown, without its list marker or indentation; undefined for a block markdown has no word for
const render = (node: Obj) => {
  switch (str(node._type)) {
    case "block": {
      const style = str(node.style);
      const text = inline(node, false);
      const depth = /^h([1-6])$/.exec(style ?? "")?.[1];
      if (depth) return `${"#".repeat(Number(depth))} ${text}`;
      if (style === "blockquote")
        return escapeLineStart(text)
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n");
      return escapeLineStart(text);
    }
    case "code": {
      const code = str(node.code) ?? "";
      const meta = str(node.meta);
      const ticks = fence(code);
      return `${ticks}${str(node.language) ?? ""}${meta === undefined ? "" : ` ${meta}`}\n${code}\n${ticks}`;
    }
    case "table":
      return table(node);
    case "html":
      return str(node.html) ?? "";
    case "thematicBreak":
      return "---";
    default:
      return undefined;
  }
};

export const portableTextToMarkdown = (value: unknown) => {
  const pieces: { text: string; sep: string; quote: boolean }[] = [];
  const widths: number[] = [];
  // the list being written at each level: its kind, and whether it is loose. A nested list has
  // its own answer — a tight list inside a loose item stays tight, which is how marked read it —
  // so the state is per level and is reset deeper down whenever an item starts.
  const kinds: (string | undefined)[] = [];
  const looseAt: boolean[] = [];
  const indentOf = (level: number) =>
    " ".repeat(widths.slice(1, level).reduce((sum, width) => sum + width, 0));

  for (const node of objs(value)) {
    const rendered = render(node);
    if (rendered === undefined) continue;
    const first = pieces.length === 0;
    const item = str(node.listItem);
    const itemLevel = num(node.itemLevel);

    if (item !== undefined) {
      const level = num(node.level) ?? 1;
      const starts = kinds[level] !== item;
      if (starts) {
        kinds[level] = item;
        looseAt[level] = node.loose === true;
      }
      // a new item at this level starts any deeper list under it afresh
      kinds.length = level + 1;
      looseAt.length = level + 1;
      const loose = looseAt[level] === true;
      // a blank line before the first item of a nested list is a blank line inside the item
      // above it, which makes the outer list loose, so only a loose outer list can afford one
      const looseAbove = level > 1 && looseAt[level - 1] === true;
      const marker = item === "number" ? "1." : "-";
      widths[level] = marker.length + 1;
      widths.length = level + 1;
      pieces.push({
        text: `${indentOf(level)}${marker} ${indented(rendered, " ".repeat(marker.length + 1)).replace(/^\s+/, "")}`,
        // a nested list's first item is separated from the text above it by the outer list's
        // looseness; after that, by its own
        sep: first ? "" : (starts ? level === 1 || looseAbove : loose) ? "\n\n" : "\n",
        quote: false,
      });
      continue;
    }

    if (itemLevel !== undefined && kinds.length > 0) {
      pieces.push({ text: indented(rendered, indentOf(itemLevel + 1)), sep: "\n\n", quote: false });
      continue;
    }

    kinds.length = 0;
    looseAt.length = 0;
    widths.length = 0;
    const quote = str(node.style) === "blockquote";
    const last = pieces.at(-1);
    if (quote && last?.quote) {
      // quoted paragraphs in a row are one quote
      last.text += `\n>\n${rendered}`;
      continue;
    }
    pieces.push({ text: rendered, sep: first ? "" : "\n\n", quote });
  }
  return `${pieces.map((piece) => `${piece.sep}${piece.text}`).join("")}\n`;
};
