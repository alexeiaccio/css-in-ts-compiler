// The prompt of "ask OpenCode": the picked element as cssints knows it (the css.* calls that style it, the winner of each
// property and what it beat, the tokens) plus the user's instruction. Every list is cut, so a page of a thousand rules sends
// a few kilobytes; the dev server cuts the whole once more (packages/cssints/src/devtools-server.ts).
import type { Candidate, Inspection } from "./cascade.ts";

const SITES = 8;
const ROWS = 24;
const BEATEN = 3;
const TOKENS = 12;
const CALL = 400;

/**
 * A file name relative to the root of the app, when it is under it.
 * @param {string} root the root of the app
 * @param {string} file a file name
 * @returns {string} the name under the root, or the name as given
 */
export const relative = (root: string, file: string) =>
  file.startsWith(`${root}/`) ? file.slice(root.length + 1) : file;

const cut = (text: string, max: number) => (text.length > max ? `${text.slice(0, max)}…` : text);
const flat = (text: string | null) => (text ?? "").replace(/\s+/g, " ").trim();

// html > body > main > p: the element and its three nearest ancestors
const domPath = (el: Element) => {
  const parent = el.parentElement;
  const up2 = parent?.parentElement;
  return [up2?.parentElement, up2, parent, el]
    .flatMap((e) => (e ? [`${e.localName}${e.id ? `#${e.id}` : ""}`] : []))
    .join(" > ");
};

const where = (c: Candidate) => `${c.selector} (${c.layer || "unlayered"})`;

/**
 * The prompt for an element: the instruction first, then what cssints knows of the element.
 * @param {Inspection} inspection the cascade of the element (`inspect`)
 * @param {Element} el the picked element
 * @param {string} instruction what the user asked for
 * @returns {string} the text to send to the agent
 */
export const buildPrompt = (inspection: Inspection, el: Element, instruction: string) => {
  const { root } = inspection;
  const sites = inspection.groups.flatMap((g) => (g.site ? [g.site] : []));
  const lines = [
    "Change the UI of the running app as the instruction says.",
    "The styles are written with cssints: each `css.*` call below produced the classes of the element,",
    "so edit those calls (or the markup that uses them), not the generated class names.",
    "",
    `Instruction: ${instruction.trim()}`,
    "",
    `Element: <${inspection.element}>`,
    `DOM path: ${domPath(el)}`,
    `Text: ${cut(flat(el.textContent), 120) || "(none)"}`,
    `Classes: ${[...el.classList].slice(0, 12).join(" ") || "(none)"}`,
    "",
    "Styled by (file:line, the call as written):",
  ];
  if (!sites.length) lines.push("- no cssints call: the element is styled elsewhere");
  for (const s of sites.slice(0, SITES))
    lines.push(`- ${relative(root, s.file)}:${s.line}`, `  ${cut(flat(s.text ?? ""), CALL)}`);
  if (sites.length > SITES) lines.push(`- … and ${sites.length - SITES} more`);
  lines.push("", "Properties now (the winner, then what it beat):");
  for (const r of inspection.rows.slice(0, ROWS)) {
    if (!r.winner) continue;
    const w = r.winner;
    const beaten = r.overridden
      .slice(0, BEATEN)
      .map((c) => `${c.decl.prop}: ${c.decl.value} ${where(c)}`);
    lines.push(
      `- ${w.decl.prop}: ${w.decl.value}${w.decl.important ? " !important" : ""} from ${where(w)}` +
        (beaten.length ? `; overridden: ${beaten.join("; ")}` : ""),
    );
  }
  if (inspection.rows.length > ROWS) lines.push(`- … and ${inspection.rows.length - ROWS} more`);
  if (inspection.tokens.length) {
    lines.push("", "Tokens it reads:");
    for (const t of inspection.tokens.slice(0, TOKENS))
      lines.push(`- ${t.name} = ${t.computed || "(not set)"}${t.path ? ` (${t.path})` : ""}`);
  }
  return lines.join("\n");
};
