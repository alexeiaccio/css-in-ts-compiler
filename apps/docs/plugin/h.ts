// The `h` of the playground's preview (src/playground/preview.ts) that makes a string: the modules of an example, compiled by the
// plugin, import it (plugin/examples.ts) and call it for their JSX. The attributes follow the same rules (hyper.ts).
import { attrs, main } from "../src/playground/hyper.ts";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/;

// an element: its html is not text, so a parent does not escape it
class Html {
  html: string;
  constructor(html: string) {
    this.html = html;
  }
}

const text = (c: unknown): string =>
  Array.isArray(c)
    ? c.map(text).join("")
    : c == null || c === false
      ? ""
      : c instanceof Html
        ? c.html
        : esc(String(c as string));

export const h = (tag: unknown, props: Record<string, unknown> | null, ...kids: unknown[]) => {
  props ??= {};
  if (typeof tag === "function")
    return (tag as (p: Record<string, unknown>) => unknown)({
      ...props,
      children: kids.length < 2 ? kids[0] : kids,
    });
  const open = `<${String(tag)}${attrs(props)
    .map(([k, v]) => ` ${k}="${esc(v)}"`)
    .join("")}>`;
  return new Html(VOID.test(String(tag)) ? open : `${open}${text(kids)}</${String(tag)}>`);
};

export const Fragment = (props: { children: unknown }) => new Html(text(props.children));

// The html of what a module shows (preview.ts: its component, called with no props)
export const render = (exports: Record<string, unknown>): string => {
  const app = main(exports);
  if (typeof app !== "function") throw new Error("the entry has no component to show");
  return text((app as (p: Record<string, unknown>) => unknown)({}));
};
