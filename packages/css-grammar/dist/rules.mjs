import { RuleError } from "./errors.mjs";
import { matches } from "./twin-core.mjs";
import { Effect, Formatter } from "effect";
//#region src/rules.ts
const splitList = (v) => v.match(/(?:"[^"]*"|'[^']*'|\([^()]*(?:\([^()]*\)[^()]*)*\)|[^,"'()])+/g)?.map((s) => s.trim()) ?? [];
const CSS_WIDE = /* @__PURE__ */ new Set([
	"inherit",
	"initial",
	"unset",
	"revert",
	"revert-layer",
	"revert-rule"
]);
const strings = (v) => [...v.matchAll(/"([^"]*)"|'([^']*)'/g)].map((m) => m[1] ?? m[2]);
const negative = (v) => {
	for (let p = ""; p !== v;) [p, v] = [v, v.replace(/\([^()]*\)/g, "")];
	return /(^|[\s,])-\.?\d/.test(v);
};
const words = (v) => v.toLowerCase().split(/[\s(),]+/).filter(Boolean);
function gridAreas(v) {
	const grid = strings(v).map((s) => {
		const cells = [];
		for (const [, name, nul, trash] of s.matchAll(/([\w\u0080-\uffff-]+)|(\.+)|\s+|(.)/gu)) {
			if (trash) return `the string "${s}" has a trash token ${Formatter.formatJson(trash)}`;
			if (name || nul) cells.push(name ?? "");
		}
		return cells;
	});
	const bad = grid.find((r) => typeof r === "string");
	if (bad) return `${bad} (css-grid-2 §7.3)`;
	const rows = grid;
	if (rows.some((r) => !r.length || r.length !== rows[0].length)) return `every string needs the same number, at least one, of cell tokens (css-grid-2 §7.3)`;
	const areas = /* @__PURE__ */ new Map();
	rows.forEach((r, y) => r.forEach((n, x) => n && areas.set(n, [...areas.get(n) ?? [], [y, x]])));
	for (const [n, cs] of areas) {
		const ys = cs.map((c) => c[0]), xs = cs.map((c) => c[1]);
		if ((Math.max(...ys) - Math.min(...ys) + 1) * (Math.max(...xs) - Math.min(...xs) + 1) !== cs.length) return `the area "${n}" is not a rectangle (css-grid-2 §7.3)`;
	}
}
function gridLine(v) {
	for (const part of v.split("/")) {
		const t = words(part);
		const spans = t.filter((w) => w === "span").length;
		if (spans > 1 || spans === 1 && t.length === 1) return `"${part.trim()}" uses span as a line name, which the <custom-ident> excludes (css-grid-2 §8.3)`;
		const ints = t.filter((w) => /^[+-]?\d+$/.test(w)).map(Number);
		if (ints.includes(0) || spans && ints.some((n) => n < 1)) return `"${part.trim()}" has an integer that is zero, or negative in a span (css-grid-2 §8.3)`;
	}
}
const subgridAutoFill = (v) => /^\s*subgrid\b/.test(v) && (v.match(/repeat\(\s*auto-fill/g) ?? []).length > 1 ? `auto-fill is only valid once on a subgrid (css-grid-2 §7.2.3.2)` : void 0;
const counterName = (v) => v.trim().toLowerCase() !== "none" && words(v).includes("none") ? `"none" cannot be a counter name (css-lists-3 §4)` : void 0;
const svgRadius = (v) => negative(v) ? `a negative radius is illegal (svg2 §7.3-7.5)` : void 0;
const strokeLength = (v) => negative(v) ? `negative values are invalid (fill-stroke-3 §4.2.1, §4.3.1)` : void 0;
function pathData(d) {
	const NUMBER = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/y, FLAG = /[01]/y, SEP = /\s*,?\s*/y, ARGS = {
		m: 2,
		l: 2,
		h: 1,
		v: 1,
		c: 6,
		s: 4,
		q: 4,
		t: 2,
		a: 7,
		z: 0
	};
	let i = 0;
	const eat = (r) => (r.lastIndex = i, r.test(d) && (i = r.lastIndex, true));
	eat(SEP);
	if (i === d.length) return true;
	if (!/[Mm]/.test(d[i])) return false;
	while (i < d.length) {
		const n = ARGS[d[i++].toLowerCase()];
		if (n === void 0) return false;
		eat(SEP);
		if (n === 0) continue;
		do
			for (let k = 0; k < n; k++) {
				if (!eat(n === 7 && (k === 3 || k === 4) ? FLAG : NUMBER)) return false;
				eat(SEP);
			}
		while (i < d.length && !/[A-Za-z]/.test(d[i]));
	}
	return true;
}
const openTypeTags = (v) => {
	const bad = strings(v).find((s) => !/^[\x20-\x7e]{4}$/.test(s));
	if (bad !== void 0) return `"${bad}" is not a four-character tag of U+20-7E (css-fonts-4 §6.12, §8.2)`;
};
const rules = {
	"grid-template-areas": gridAreas,
	"grid-template": gridAreas,
	grid: gridAreas,
	"grid-row": gridLine,
	"grid-column": gridLine,
	"grid-row-start": gridLine,
	"grid-row-end": gridLine,
	"grid-column-start": gridLine,
	"grid-column-end": gridLine,
	"grid-area": gridLine,
	"grid-template-rows": subgridAutoFill,
	"grid-template-columns": subgridAutoFill,
	"counter-reset": counterName,
	"counter-set": counterName,
	"counter-increment": counterName,
	"container-name"(v) {
		const bad = v.trim().toLowerCase() !== "none" && words(v).find((w) => [
			"none",
			"and",
			"not",
			"or"
		].includes(w));
		if (bad) return `"${bad}" cannot be a container name (css-conditional-5 §5.2)`;
	},
	"view-transition-class"(v) {
		if (v.trim().toLowerCase() !== "none" && words(v).includes("none")) return `"none" cannot be combined with another class (css-view-transitions-2 §10.3)`;
	},
	"color-scheme"(v) {
		const t = words(v);
		if (t.length > 1 && t.includes("normal")) return `"normal" cannot be combined with schemes (css-color-adjust-1 §2.2)`;
		if (t.some((w, i) => w === "only" && i > 0 && i < t.length - 1) || t.filter((w) => w === "only").length > 1) return `"only" is a keyword, not a scheme name, and goes first or last (css-color-adjust-1 §2.2)`;
	},
	"font-feature-settings": openTypeTags,
	"font-variation-settings": openTypeTags,
	"font-language-override"(v) {
		const long = strings(v).find((s) => s.length > 4);
		if (long !== void 0) return `"${long}" is longer than an OpenType language system tag, four characters (css-fonts-4)`;
	},
	font: (v) => rules["font-family"](splitList(v).slice(1).join(", ")),
	r: svgRadius,
	rx: svgRadius,
	ry: svgRadius,
	"stroke-miterlimit": (v) => negative(v) ? `a negative miter limit is illegal (svg2 §13.5.5)` : void 0,
	"stroke-width": strokeLength,
	"stroke-dasharray": strokeLength,
	transition(v) {
		const items = splitList(v);
		if (items.length > 1 && items.some((t) => t.replace(/\([^)]*\)/g, "").split(/\s+/).includes("none"))) return `"none" is only valid when it is the only transition, this list has ${items.length} (css-transitions-1 §2.5)`;
		for (const item of items) {
			const times = item.replace(/\([^)]*\)/g, "").split(/\s+/).filter((t) => matches("<time>", t));
			if (times.length === 2 && times.every((t) => t.startsWith("-"))) return `one of the times in "${item}" is the duration, which cannot be negative (css-transitions-1 §2.2, §2.5)`;
			const taken = /* @__PURE__ */ new Set();
			for (const t of item.match(/[\w-]+\([^)]*\)|\S+/g) ?? []) {
				const slot = ["<easing-function>", "<transition-behavior-value>"].find((g) => matches(g, t));
				if (slot && !taken.has(slot)) taken.add(slot);
				else if (slot && (t.includes("(") || taken.has("ident"))) return `"${t}" has no place left in "${item}": an earlier keyword took the ${slot} (css-values-4 §4.2)`;
				else if (t === "none" || matches("<single-transition-property>", t)) taken.add("ident");
			}
		}
	},
	animation(v) {
		const slots = [
			"<easing-function>",
			"<single-animation-iteration-count>",
			"<single-animation-direction>",
			"<single-animation-fill-mode>",
			"<single-animation-play-state>"
		];
		for (const item of splitList(v)) {
			const taken = /* @__PURE__ */ new Set();
			for (const t of item.match(/[\w-]+\([^)]*\)|\S+/g) ?? []) {
				const slot = slots.find((g) => matches(g, t));
				if (!slot) continue;
				if (!taken.has(slot)) taken.add(slot);
				else if (t.includes("(") || taken.has("name") || !matches("<keyframes-name>", t)) return `"${t}" has no place left in "${item}": an earlier keyword took the ${slot} (css-values-4 §4.2)`;
				else taken.add("name");
			}
		}
	},
	"font-family"(v) {
		const items = splitList(v);
		for (const item of items) {
			if (/^["']/.test(item)) continue;
			const ids = item.split(/\s+/);
			if (ids.length === 1 && matches("<generic-family>", ids[0].toLowerCase())) continue;
			if (items.length === 1 && ids.length === 1 && CSS_WIDE.has(ids[0].toLowerCase())) continue;
			const bad = ids.find((id) => id.toLowerCase() === "default" || CSS_WIDE.has(id.toLowerCase()) || matches("<generic-family>", id.toLowerCase()));
			if (bad) return `the keyword "${bad}" cannot be (part of) the unquoted family name "${item}", quote the name (css-fonts-4 §2.1.1)`;
		}
	}
};
const fnRules = [
	(_, v) => {
		const m = /\b(grayscale|sepia|saturate|opacity|invert|brightness|contrast|blur)\(\s*-/.exec(v);
		if (m) return `${m[1]}() cannot take a negative value (filter-effects-1 §6.1)`;
	},
	(_, v) => {
		for (const m of v.matchAll(/\bpath\(\s*(?:(?:nonzero|evenodd)\s*,\s*)?(?:"([^"]*)"|'([^']*)')/g)) {
			const d = m[1] ?? m[2];
			if (!pathData(d)) return `"${d}" is not SVG path data (css-shapes-1 §3.1, svg2 §9.3.9)`;
		}
	},
	(_, v) => {
		for (const [f, n, pos] of v.matchAll(/steps\(\s*([+-]?\d+)\s*(?:,\s*([a-z-]+)\s*)?\)/g)) {
			const min = pos === "jump-none" ? 2 : 1;
			if (Number(n) < min) return `${f} needs at least ${min} step${min > 1 ? "s" : ""} (css-easing-2 §2.3)`;
		}
	},
	(p, v) => {
		if (v.includes("anchor-size(") && !/^((min-|max-)?(width|height|block-size|inline-size)|top|left|right|bottom|inset(-.+)?|margin(-.+)?)$/.test(p)) return `anchor-size() is only valid in sizing, inset and margin properties (css-anchor-position-1 §5)`;
	}
];
function violation(p, v) {
	let why = rules[p]?.(v);
	for (const f of fnRules) why ??= f(p, v);
	return why ? new RuleError({
		message: `${p}: in "${v}", ${why}`,
		property: p,
		value: v,
		reason: why
	}) : void 0;
}
const checkRules = Effect.fnUntraced(function* (p, v) {
	const error = violation(p, v);
	if (error) return yield* error;
	return v;
});
//#endregion
export { checkRules, violation };
