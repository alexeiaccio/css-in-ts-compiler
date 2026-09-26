// Shared by the processor (build time) and preeval (eval time).
const PROPS = { p: "padding", m: "margin", gap: "gap", items: "align-items", justify: "justify-content", color: "color", bg: "background-color" };
const SPACING = new Set(["padding", "margin", "gap"]);
const isNode = (v) => !!v && typeof v === "object" && Array.isArray(v.__cssints);

function toDecls(member, args) {
  const children = args.filter(isNode).flatMap((n) => n.__cssints);
  const plain = args.filter((a) => !isNode(a));
  const composite = { flex: [["display", "flex"]], cn: [] }[member];
  if (composite) {
    // Strings here mean wyw handed us class names instead of css.* values (hybrid strategy or its arg-queue bug).
    if (plain.length) throw new Error(`cssints: css.${member} takes css.* values only, got ${JSON.stringify(plain)}`);
    return [...composite, ...children];
  }
  const prop = PROPS[member];
  if (!prop) throw new Error(`cssints: unknown css.${member}`);
  if (plain.length !== 1) throw new Error(`cssints: css.${member} expects 1 value, got ${JSON.stringify(args)}`);
  const v = plain[0];
  return [[prop, typeof v === "number" && SPACING.has(prop) ? `${v * 0.25}rem` : String(v)], ...children];
}

// ponytail: djb2, 32-bit; swap for xxhash if collisions ever show up.
function classOf([p, v]) {
  let h = 5381;
  for (const c of `${p}:${v}`) h = ((h << 5) + h + c.charCodeAt(0)) | 0;
  return "_" + (h >>> 0).toString(36);
}

export { toDecls, classOf, isNode };
