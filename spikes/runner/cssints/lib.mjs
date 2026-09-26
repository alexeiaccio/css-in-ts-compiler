// Shared by the runtime (eval time) and the plugin (build time).
export const PROPS = {
  display: "display",
  position: "position",
  flex: "flex",
  flexDirection: "flex-direction",
  flexGrow: "flex-grow",
  flexShrink: "flex-shrink",
  items: "align-items",
  justify: "justify-content",
  gap: "gap",
  flexWrap: "flex-wrap",
  width: "width",
  height: "height",
  maxWidth: "max-width",
  maxHeight: "max-height",
  overflow: "overflow",
  padding: "padding",
  paddingTop: "padding-top",
  paddingRight: "padding-right",
  paddingBottom: "padding-bottom",
  paddingLeft: "padding-left",
  margin: "margin",
  marginTop: "margin-top",
  marginRight: "margin-right",
  marginBottom: "margin-bottom",
  marginLeft: "margin-left",
  fontSize: "font-size",
  fontWeight: "font-weight",
  fontFamily: "font-family",
  lineHeight: "line-height",
  letterSpacing: "letter-spacing",
  textAlign: "text-align",
  textDecoration: "text-decoration",
  textTransform: "text-transform",
  whiteSpace: "white-space",
  color: "color",
  bg: "background-color",
  background: "background",
  border: "border",
  borderColor: "border-color",
  borderWidth: "border-width",
  borderStyle: "border-style",
  borderRadius: "border-radius",
  boxShadow: "box-shadow",
  opacity: "opacity",
  transition: "transition",
  transform: "transform",
  cursor: "cursor",
  zIndex: "z-index",
  p: "padding",
  pt: "padding-top",
  pr: "padding-right",
  pb: "padding-bottom",
  pl: "padding-left",
  m: "margin",
  mt: "margin-top",
  mr: "margin-right",
  mb: "margin-bottom",
  ml: "margin-left",
};
const SPACING = new Set(["padding", "margin", "gap"]);
const isNode = (v) => !!v && typeof v === "object" && Array.isArray(v.__cssints);

export function toDecls(member, args) {
  const children = args.filter(isNode).flatMap((n) => n.__cssints);
  const plain = args.filter((a) => !isNode(a));
  const composite = { flex: [["display", "flex"]], cn: [] }[member];
  if (composite) {
    if (plain.length) throw new Error(`cssints: css.${member} takes css.* values only, got ${JSON.stringify(plain)}`);
    return [...composite, ...children];
  }
  const prop = PROPS[member];
  if (!prop) throw new Error(`cssints: unknown css.${member}`);
  if (!plain.length) throw new Error(`cssints: css.${member} expects a value, got ${JSON.stringify(args)}`);
  const v = plain[0];
  // parts (strings, Typed OM values) are joined by a space; a lone number is the spacing scale
  return [[prop, plain.length === 1 && typeof v === "number" && SPACING.has(prop) ? `${v * 0.25}rem` : plain.join(" ")], ...children];
}

// "a: b; c: d" -> [["a","b"],["c","d"]]  (cv() config strings)
export const parseStyles = (s) =>
  s.split(";").map((d) => d.trim()).filter(Boolean).map((d) => { const i = d.indexOf(":"); return [d.slice(0, i).trim(), d.slice(i + 1).trim()]; });

// ponytail: djb2, 32-bit; swap for xxhash if collisions ever show up.
export function classOf([p, v]) {
  let h = 5381;
  for (const c of `${p}:${v}`) h = ((h << 5) + h + c.charCodeAt(0)) | 0;
  return "_" + (h >>> 0).toString(36);
}
