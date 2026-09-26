// Prose rules: validity rules that the specs state in text, not in the value grammar. One function per
// property; it returns why the value is invalid, or undefined. `checkRules` throws like the twin's `valid`.
import { matches } from "./twin.ts";

// Top-level comma split: commas inside (...) or quotes do not count.
const splitList = (v: string) => v.match(/(?:"[^"]*"|'[^']*'|\([^()]*(?:\([^()]*\)[^()]*)*\)|[^,"'()])+/g)?.map((s) => s.trim()) ?? [];

const CSS_WIDE = new Set(["inherit", "initial", "unset", "revert", "revert-layer", "revert-rule"]);

const rules: Record<string, (v: string) => string | undefined> = {
  // https://drafts.csswg.org/css-transitions-1/#transition-shorthand-property (§2.5): "If there is more than one
  // <single-transition> in the shorthand, and any of the transitions has none as the <single-transition-property>,
  // then the declaration is invalid."
  transition(v) {
    const items = splitList(v);
    if (items.length > 1 && items.some((t) => t.replace(/\([^)]*\)/g, "").split(/\s+/).includes("none")))
      return `"none" is only valid when it is the only transition, this list has ${items.length} (css-transitions-1 §2.5)`;
  },
  // https://drafts.csswg.org/css-fonts-4/#font-family-name-syntax (§2.1.1): "Any identifier which could be
  // misinterpreted as a pre-defined keyword in the font-family value definition, or the CSS-wide keywords, is not
  // allowed." A lone generic keyword is the generic family, a lone CSS-wide keyword as the whole value is itself;
  // `default` is reserved (css-values-4 <custom-ident>). Chrome only checks the first identifier of a name.
  "font-family"(v) {
    const items = splitList(v);
    for (const item of items) {
      if (/^["']/.test(item)) continue;
      const ids = item.split(/\s+/);
      if (ids.length === 1 && matches("<generic-family>", ids[0]!.toLowerCase())) continue;
      if (items.length === 1 && ids.length === 1 && CSS_WIDE.has(ids[0]!.toLowerCase())) continue;
      const bad = ids.find((id) => id.toLowerCase() === "default" || CSS_WIDE.has(id.toLowerCase()) || matches("<generic-family>", id.toLowerCase()));
      if (bad) return `the keyword "${bad}" cannot be (part of) the unquoted family name "${item}", quote the name (css-fonts-4 §2.1.1)`;
    }
  },
};

export function checkRules(p: string, v: string): string {
  const why = rules[p]?.(v);
  if (why) throw new TypeError(`${p}: in "${v}", ${why}`);
  return v;
}
