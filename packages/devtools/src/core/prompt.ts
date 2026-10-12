// The prompt of "ask OpenCode": the picked element as cssints knows it (the css.* calls that style it, the winner of each
// property and what it beat, the tokens) plus the user's instruction, the route and how the page is displayed. Every list is
// cut, so a page of a thousand rules sends a few kilobytes; the dev server adds an `App:` line on top and cuts the whole once
// more, from the end (packages/cssints/src/devtools-server.ts): the instruction and the header come first and stay.
import type { Candidate, Inspection } from "./cascade.ts";

const SITES = 8;
const ROWS = 24;
const BEATEN = 3;
const TOKENS = 12;
const CALL = 400;
const INSTRUCTION = 4000;
const VALUE = 80;
const ATTRS = 8;
const HTML_ATTRS = 12;
// what tells what an element is; never `value`: a form's values stay in the page
const IDENTITY = new Set([
  "id",
  "role",
  "aria-label",
  "href",
  "src",
  "alt",
  "type",
  "name",
  "placeholder",
  "title",
]);

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

const label = (e: Element) => `${e.localName}${e.id ? `#${e.id}` : ""}`;

// html > body > main > p: the element and its three nearest ancestors
const domPath = (el: Element) => {
  const parent = el.parentElement;
  const up2 = parent?.parentElement;
  return [up2?.parentElement, up2, parent, el].flatMap((e) => (e ? [label(e)] : [])).join(" > ");
};

const where = (c: Candidate) => `${c.selector} (${c.layer || "unlayered"})`;

// name="value" of the attributes `keep` names, each value cut
const attrs = (el: Element, keep: (name: string) => boolean, max: number) =>
  [...el.attributes]
    .flatMap((a) => (keep(a.name) ? [`${a.name}="${cut(flat(a.value), VALUE)}"`] : []))
    .slice(0, max)
    .join(" ");

// the data-* of the element and its three nearest ancestors (<html>'s are in the header)
const dataLines = (el: Element) => {
  const parent = el.parentElement;
  const up2 = parent?.parentElement;
  return [el, parent, up2, up2?.parentElement].flatMap((e) => {
    const data =
      e && e !== el.ownerDocument.documentElement && attrs(e, (n) => n.startsWith("data-"), ATTRS);
    return e && data ? [`Data of ${label(e)}: ${data}`] : [];
  });
};

// the route, the title and what decides how the page looks now: the same for both prompts
const header = (doc: Document, el?: Element) => {
  const { defaultView: win, location: at } = doc;
  if (!win) return [];
  const { innerWidth: w, innerHeight: h, devicePixelRatio: dpr } = win;
  const root = attrs(
    doc.documentElement,
    (n) => n === "class" || n.startsWith("data-"),
    HTML_ATTRS,
  );
  const lines = [
    `Page: ${cut(at.pathname + at.search + at.hash, 300)}`,
    `Title: ${cut(flat(doc.title), 120) || "(none)"}`,
    "Display:",
    `- viewport: ${w}x${h}${dpr === 1 ? "" : `, devicePixelRatio ${dpr}`}`,
  ];
  if (root) lines.push(`- <html> ${root}`);
  const dark = win.matchMedia("(prefers-color-scheme: dark)").matches;
  const still = win.matchMedia("(prefers-reduced-motion: reduce)").matches;
  lines.push(
    `- prefers-color-scheme: ${dark ? "dark" : "light"}${still ? "; prefers-reduced-motion: reduce" : ""}`,
  );
  if (el) {
    const r = el.getBoundingClientRect();
    const state = [
      el.matches(":hover") ? ["hovered"] : [],
      doc.activeElement === el ? ["focused"] : [],
      el.matches(":disabled") || el.getAttribute("aria-disabled") === "true" ? ["disabled"] : [],
    ].flat();
    lines.push(
      `- rect: ${Math.round(r.width)}x${Math.round(r.height)} at ${Math.round(r.x)},${Math.round(r.y)} in the viewport${state.length ? `; ${state.join(", ")}` : ""}`,
    );
  }
  return lines;
};

/**
 * The prompt with no element picked: the instruction, the page it is about and how it is displayed.
 * @param {string} instruction what the user asked for
 * @param {Document} doc the document of the page
 * @returns {string} the text to send to the agent
 */
export const pagePrompt = (instruction: string, doc: Document) =>
  [
    "Change the UI of the running app as the instruction says.",
    "The styles are written with cssints (`css.*` calls): edit those calls, not the generated class names.",
    "Find the markup from the route (Page) and the app (App).",
    "",
    `Instruction: ${cut(instruction.trim(), INSTRUCTION)}`,
    "",
    ...header(doc),
  ].join("\n");

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
    "The styles are written with cssints: each `css.*` call under `Styled by` produced the classes of the element,",
    "so start from those files and edit those calls, not the generated class names.",
    "For the markup, start from the route (Page) and the app (App).",
    "",
    `Instruction: ${cut(instruction.trim(), INSTRUCTION)}`,
    "",
    ...header(el.ownerDocument, el),
    "",
    `Element: <${inspection.element}>`,
    `DOM path: ${domPath(el)}`,
    `Text: ${cut(flat(el.textContent), 120) || "(none)"}`,
    `Classes: ${[...el.classList].slice(0, 12).join(" ") || "(none)"}`,
    `Attributes: ${attrs(el, (n) => IDENTITY.has(n), IDENTITY.size) || "(none)"}`,
    ...dataLines(el),
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
